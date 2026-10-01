package com.jobportal.service;

import com.jobportal.dto.JobDtos.AdminJobStatusRequest;
import com.jobportal.dto.JobDtos.JobDto;
import com.jobportal.dto.JobDtos.JobRequest;
import com.jobportal.dto.JobDtos.JobSearchCriteria;
import com.jobportal.dto.PageResponse;
import com.jobportal.exception.ApiException;
import com.jobportal.model.*;
import com.jobportal.repository.CompanyRepository;
import com.jobportal.repository.JobApplicationRepository;
import com.jobportal.repository.JobRepository;
import com.jobportal.repository.SavedJobRepository;
import com.jobportal.security.AppUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final CompanyRepository companyRepository;
    private final JobApplicationRepository applicationRepository;
    private final SavedJobRepository savedJobRepository;
    private final FileStorageService fileStorageService;

    // ---------- Public ----------

    @Transactional(readOnly = true)
    public PageResponse<JobDto> search(JobSearchCriteria criteria, String sort, Pageable pageable,
                                       AppUserDetails viewer) {
        Specification<Job> spec = JobSpecifications.search(criteria, JobStatus.ACTIVE)
                .and(JobSpecifications.sortedBy(sort));
        Page<Job> page = jobRepository.findAll(spec, pageable);

        Set<Long> saved = Set.of();
        Set<Long> applied = Set.of();
        boolean seeker = viewer != null && viewer.getRole() == Role.JOB_SEEKER;
        if (seeker) {
            saved = new HashSet<>(savedJobRepository.findJobIdsByUser(viewer.getId()));
            applied = new HashSet<>(applicationRepository.findActiveJobIdsByApplicant(viewer.getId()));
        }
        Set<Long> savedIds = saved;
        Set<Long> appliedIds = applied;
        return PageResponse.of(page, j -> DtoMapper.toJobDto(j, null,
                seeker ? savedIds.contains(j.getId()) : null,
                seeker ? appliedIds.contains(j.getId()) : null));
    }

    @Transactional(readOnly = true)
    public JobDto getForViewer(Long jobId, AppUserDetails viewer) {
        Job job = findJob(jobId);
        boolean privileged = viewer != null && (viewer.getRole() == Role.ADMIN
                || (viewer.getRole() == Role.EMPLOYER && job.getCompany().getOwner().getId().equals(viewer.getId())));
        if (job.getStatus() == JobStatus.REMOVED && !privileged) {
            throw ApiException.notFound("Job not found");
        }
        if (viewer != null && viewer.getRole() == Role.JOB_SEEKER) {
            boolean saved = savedJobRepository.existsByUserIdAndJobId(viewer.getId(), jobId);
            boolean applied = applicationRepository.findByJobIdAndApplicantId(jobId, viewer.getId())
                    .map(a -> a.getStatus() != ApplicationStatus.WITHDRAWN)
                    .orElse(false);
            return DtoMapper.toJobDto(job, null, saved, applied);
        }
        return DtoMapper.toJobDto(job, null, null, null);
    }

    // ---------- Employer ----------

    @Transactional(readOnly = true)
    public List<JobDto> listForEmployer(Long employerId) {
        Company company = companyRepository.findByOwnerId(employerId).orElse(null);
        if (company == null) {
            return List.of();
        }
        List<Job> jobs = jobRepository.findByCompanyIdOrderByCreatedAtDesc(company.getId());
        Map<Long, Long> counts = applicationCounts(jobs);
        return jobs.stream()
                .map(j -> DtoMapper.toJobDto(j, counts.getOrDefault(j.getId(), 0L), null, null))
                .toList();
    }

    @Transactional(readOnly = true)
    public JobDto getForEmployer(Long employerId, Long jobId) {
        Job job = findOwnedJob(employerId, jobId);
        return DtoMapper.toJobDto(job, applicationCounts(List.of(job)).getOrDefault(jobId, 0L), null, null);
    }

    @Transactional
    public JobDto create(Long employerId, JobRequest req) {
        Company company = companyRepository.findByOwnerId(employerId)
                .orElseThrow(() -> ApiException.badRequest("Create your company profile before posting jobs"));
        Job job = new Job();
        job.setCompany(company);
        apply(job, req);
        job.setStatus(req.status() == JobStatus.CLOSED ? JobStatus.CLOSED : JobStatus.ACTIVE);
        jobRepository.save(job);
        return DtoMapper.toJobDto(job, 0L, null, null);
    }

    @Transactional
    public JobDto update(Long employerId, Long jobId, JobRequest req) {
        Job job = findOwnedJob(employerId, jobId);
        if (job.getStatus() == JobStatus.REMOVED) {
            throw ApiException.forbidden("This listing was removed by an administrator and cannot be edited");
        }
        apply(job, req);
        if (req.status() == JobStatus.ACTIVE || req.status() == JobStatus.CLOSED) {
            job.setStatus(req.status());
        }
        jobRepository.saveAndFlush(job);
        return DtoMapper.toJobDto(job, applicationCounts(List.of(job)).getOrDefault(jobId, 0L), null, null);
    }

    @Transactional
    public void delete(Long employerId, Long jobId) {
        Job job = findOwnedJob(employerId, jobId);
        deleteJobAndFiles(job);
    }

    // ---------- Admin ----------

    @Transactional(readOnly = true)
    public PageResponse<JobDto> adminList(String q, JobStatus status, Pageable pageable) {
        JobSearchCriteria criteria = new JobSearchCriteria(q, null, null, null, null, null, null, null);
        Specification<Job> spec = JobSpecifications.search(criteria, status)
                .and(JobSpecifications.sortedBy("newest"));
        Page<Job> page = jobRepository.findAll(spec, pageable);
        Map<Long, Long> counts = applicationCounts(page.getContent());
        return PageResponse.of(page, j -> DtoMapper.toJobDto(j, counts.getOrDefault(j.getId(), 0L), null, null));
    }

    @Transactional
    public JobDto adminSetStatus(Long jobId, AdminJobStatusRequest req) {
        Job job = findJob(jobId);
        job.setStatus(req.status());
        job.setRemovalReason(req.status() == JobStatus.REMOVED
                ? Optional.ofNullable(req.reason()).filter(r -> !r.isBlank()).orElse("Violates platform guidelines")
                : null);
        jobRepository.saveAndFlush(job);
        return DtoMapper.toJobDto(job, applicationCounts(List.of(job)).getOrDefault(jobId, 0L), null, null);
    }

    @Transactional
    public void adminDelete(Long jobId) {
        deleteJobAndFiles(findJob(jobId));
    }

    // ---------- Helpers ----------

    Job findJob(Long jobId) {
        return jobRepository.findById(jobId).orElseThrow(() -> ApiException.notFound("Job not found"));
    }

    Job findOwnedJob(Long employerId, Long jobId) {
        Job job = findJob(jobId);
        if (!job.getCompany().getOwner().getId().equals(employerId)) {
            throw ApiException.notFound("Job not found");
        }
        return job;
    }

    private void deleteJobAndFiles(Job job) {
        List<String> files = applicationRepository.findResumePathsByJob(job.getId());
        jobRepository.delete(job);
        jobRepository.flush();
        fileStorageService.deleteAllQuietly(files);
    }

    private Map<Long, Long> applicationCounts(Collection<Job> jobs) {
        if (jobs.isEmpty()) {
            return Map.of();
        }
        List<Long> ids = jobs.stream().map(Job::getId).toList();
        return applicationRepository.countByJobIds(ids).stream()
                .collect(Collectors.toMap(r -> (Long) r[0], r -> (Long) r[1]));
    }

    private static void apply(Job job, JobRequest req) {
        job.setTitle(req.title().trim());
        job.setDescription(req.description().trim());
        job.setLocation(req.location().trim());
        job.setRemote(req.remote());
        job.setJobType(req.jobType());
        job.setExperienceLevel(req.experienceLevel());
        job.setSalaryMin(req.salaryMin());
        job.setSalaryMax(req.salaryMax());
        // Dedupe case-insensitively while keeping the employer's spelling.
        Map<String, String> unique = new LinkedHashMap<>();
        if (req.skills() != null) {
            req.skills().stream().map(String::trim).filter(s -> !s.isEmpty())
                    .forEach(s -> unique.putIfAbsent(s.toLowerCase(Locale.ROOT), s));
        }
        job.getSkills().clear();
        job.getSkills().addAll(unique.values());
    }
}
