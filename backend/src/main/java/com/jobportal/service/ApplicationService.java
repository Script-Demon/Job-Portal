package com.jobportal.service;

import com.jobportal.dto.ApplicationDtos.ApplicationDto;
import com.jobportal.dto.ApplicationDtos.ApplyRequest;
import com.jobportal.exception.ApiException;
import com.jobportal.model.*;
import com.jobportal.repository.JobApplicationRepository;
import com.jobportal.repository.SeekerProfileRepository;
import com.jobportal.repository.UserRepository;
import com.jobportal.service.SeekerService.DownloadableFile;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final JobApplicationRepository applicationRepository;
    private final SeekerProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final JobService jobService;
    private final FileStorageService fileStorageService;

    // ---------- Job seeker ----------

    @Transactional
    public ApplicationDto apply(Long seekerId, Long jobId, ApplyRequest req) {
        Job job = jobService.findJob(jobId);
        if (job.getStatus() != JobStatus.ACTIVE) {
            throw ApiException.badRequest("This job is no longer accepting applications");
        }
        SeekerProfile profile = profileRepository.findByUserId(seekerId).orElse(null);
        if (profile == null || profile.getResumePath() == null) {
            throw ApiException.badRequest("Please upload your resume in your profile before applying");
        }

        JobApplication app = applicationRepository.findByJobIdAndApplicantId(jobId, seekerId).orElse(null);
        String oldResume = null;
        if (app != null) {
            if (app.getStatus() != ApplicationStatus.WITHDRAWN) {
                throw ApiException.conflict("You have already applied to this job");
            }
            // Re-applying after withdrawing reuses the same row.
            oldResume = app.getResumePath();
            app.setStatus(ApplicationStatus.APPLIED);
        } else {
            app = new JobApplication();
            app.setJob(job);
            app.setApplicant(userRepository.getReferenceById(seekerId));
        }
        app.setCoverLetter(CompanyService.blankToNull(req == null ? null : req.coverLetter()));
        app.setResumePath(fileStorageService.copyForApplication(profile.getResumePath()));
        app.setResumeOriginalName(profile.getResumeOriginalName());
        app.setResumeContentType(profile.getResumeContentType());
        applicationRepository.saveAndFlush(app);
        fileStorageService.deleteQuietly(oldResume);
        return DtoMapper.toApplicationDto(app, profile);
    }

    @Transactional(readOnly = true)
    public List<ApplicationDto> listForSeeker(Long seekerId) {
        SeekerProfile profile = profileRepository.findByUserId(seekerId).orElse(null);
        return applicationRepository.findByApplicantIdOrderByAppliedAtDesc(seekerId).stream()
                .map(a -> DtoMapper.toApplicationDto(a, profile))
                .toList();
    }

    @Transactional
    public ApplicationDto withdraw(Long seekerId, Long applicationId) {
        JobApplication app = applicationRepository.findById(applicationId)
                .filter(a -> a.getApplicant().getId().equals(seekerId))
                .orElseThrow(() -> ApiException.notFound("Application not found"));
        if (app.getStatus() == ApplicationStatus.HIRED || app.getStatus() == ApplicationStatus.REJECTED) {
            throw ApiException.badRequest("This application has already been finalized");
        }
        app.setStatus(ApplicationStatus.WITHDRAWN);
        applicationRepository.saveAndFlush(app);
        return DtoMapper.toApplicationDto(app, profileRepository.findByUserId(seekerId).orElse(null));
    }

    // ---------- Employer ----------

    @Transactional(readOnly = true)
    public List<ApplicationDto> listForJob(Long employerId, Long jobId) {
        jobService.findOwnedJob(employerId, jobId);
        List<JobApplication> apps = applicationRepository.findByJobIdOrderByAppliedAtDesc(jobId);
        Map<Long, SeekerProfile> profiles = profileRepository
                .findByUserIdIn(apps.stream().map(a -> a.getApplicant().getId()).toList())
                .stream().collect(Collectors.toMap(p -> p.getUser().getId(), Function.identity()));
        return apps.stream()
                .map(a -> DtoMapper.toApplicationDto(a, profiles.get(a.getApplicant().getId())))
                .toList();
    }

    @Transactional
    public ApplicationDto updateStatus(Long employerId, Long applicationId, ApplicationStatus status) {
        JobApplication app = findForEmployer(employerId, applicationId);
        if (status == ApplicationStatus.WITHDRAWN) {
            throw ApiException.badRequest("Only the applicant can withdraw an application");
        }
        if (app.getStatus() == ApplicationStatus.WITHDRAWN) {
            throw ApiException.badRequest("The applicant has withdrawn this application");
        }
        app.setStatus(status);
        applicationRepository.saveAndFlush(app);
        return DtoMapper.toApplicationDto(app,
                profileRepository.findByUserId(app.getApplicant().getId()).orElse(null));
    }

    @Transactional(readOnly = true)
    public DownloadableFile downloadResume(Long employerId, Long applicationId) {
        JobApplication app = findForEmployer(employerId, applicationId);
        if (app.getResumePath() == null) {
            throw ApiException.notFound("No resume attached to this application");
        }
        return new DownloadableFile(fileStorageService.load(app.getResumePath()), app.getResumeOriginalName(),
                app.getResumeContentType());
    }

    private JobApplication findForEmployer(Long employerId, Long applicationId) {
        return applicationRepository.findById(applicationId)
                .filter(a -> a.getJob().getCompany().getOwner().getId().equals(employerId))
                .orElseThrow(() -> ApiException.notFound("Application not found"));
    }
}
