package com.jobportal.service;

import com.jobportal.dto.JobDtos.JobDto;
import com.jobportal.dto.ProfileDtos.ProfileDto;
import com.jobportal.dto.ProfileDtos.ProfileRequest;
import com.jobportal.exception.ApiException;
import com.jobportal.model.*;
import com.jobportal.repository.JobApplicationRepository;
import com.jobportal.repository.SavedJobRepository;
import com.jobportal.repository.SeekerProfileRepository;
import com.jobportal.repository.UserRepository;
import com.jobportal.service.FileStorageService.StoredFile;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class SeekerService {

    private final UserRepository userRepository;
    private final SeekerProfileRepository profileRepository;
    private final SavedJobRepository savedJobRepository;
    private final JobApplicationRepository applicationRepository;
    private final JobService jobService;
    private final FileStorageService fileStorageService;

    public record DownloadableFile(org.springframework.core.io.Resource resource, String fileName,
                                   String contentType) {
    }

    // ---------- Profile ----------

    @Transactional
    public ProfileDto getProfile(Long userId) {
        User user = findUser(userId);
        return DtoMapper.toProfileDto(user, getOrCreateProfile(user));
    }

    @Transactional
    public ProfileDto updateProfile(Long userId, ProfileRequest req) {
        User user = findUser(userId);
        SeekerProfile p = getOrCreateProfile(user);
        user.setFullName(req.fullName().trim());
        p.setHeadline(CompanyService.blankToNull(req.headline()));
        p.setPhone(CompanyService.blankToNull(req.phone()));
        p.setLocation(CompanyService.blankToNull(req.location()));
        p.setSummary(CompanyService.blankToNull(req.summary()));
        p.setSkills(normalizeSkills(req.skills()));
        p.setExperienceYears(req.experienceYears());
        p.setEducation(CompanyService.blankToNull(req.education()));
        p.setLinkedinUrl(CompanyService.blankToNull(req.linkedinUrl()));
        return DtoMapper.toProfileDto(user, p);
    }

    @Transactional
    public ProfileDto uploadResume(Long userId, MultipartFile file) {
        User user = findUser(userId);
        SeekerProfile p = getOrCreateProfile(user);
        StoredFile stored = fileStorageService.storeResume(file);
        String previous = p.getResumePath();
        p.setResumePath(stored.path());
        p.setResumeOriginalName(stored.originalName());
        p.setResumeContentType(stored.contentType());
        p.setResumeUploadedAt(Instant.now());
        profileRepository.flush();
        // Submitted applications keep their own copy, so the old file is safe to remove.
        fileStorageService.deleteQuietly(previous);
        return DtoMapper.toProfileDto(user, p);
    }

    @Transactional
    public ProfileDto deleteResume(Long userId) {
        User user = findUser(userId);
        SeekerProfile p = getOrCreateProfile(user);
        String previous = p.getResumePath();
        p.setResumePath(null);
        p.setResumeOriginalName(null);
        p.setResumeContentType(null);
        p.setResumeUploadedAt(null);
        profileRepository.flush();
        fileStorageService.deleteQuietly(previous);
        return DtoMapper.toProfileDto(user, p);
    }

    @Transactional(readOnly = true)
    public DownloadableFile downloadOwnResume(Long userId) {
        SeekerProfile p = profileRepository.findByUserId(userId)
                .filter(sp -> sp.getResumePath() != null)
                .orElseThrow(() -> ApiException.notFound("You have not uploaded a resume yet"));
        return new DownloadableFile(fileStorageService.load(p.getResumePath()), p.getResumeOriginalName(),
                p.getResumeContentType());
    }

    // ---------- Saved jobs ----------

    @Transactional(readOnly = true)
    public List<JobDto> savedJobs(Long userId) {
        Set<Long> applied = new HashSet<>(applicationRepository.findActiveJobIdsByApplicant(userId));
        return savedJobRepository.findByUserIdOrderBySavedAtDesc(userId).stream()
                .map(SavedJob::getJob)
                .filter(j -> j.getStatus() != JobStatus.REMOVED)
                .map(j -> DtoMapper.toJobDto(j, null, true, applied.contains(j.getId())))
                .toList();
    }

    @Transactional
    public void saveJob(Long userId, Long jobId) {
        if (savedJobRepository.existsByUserIdAndJobId(userId, jobId)) {
            return;
        }
        Job job = jobService.findJob(jobId);
        if (job.getStatus() == JobStatus.REMOVED) {
            throw ApiException.notFound("Job not found");
        }
        savedJobRepository.save(new SavedJob(userRepository.getReferenceById(userId), job));
    }

    @Transactional
    public void unsaveJob(Long userId, Long jobId) {
        savedJobRepository.findByUserIdAndJobId(userId, jobId).ifPresent(savedJobRepository::delete);
    }

    // ---------- Helpers ----------

    SeekerProfile getOrCreateProfile(User user) {
        return profileRepository.findByUserId(user.getId())
                .orElseGet(() -> profileRepository.save(new SeekerProfile(user)));
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId).orElseThrow(() -> ApiException.notFound("User not found"));
    }

    private static String normalizeSkills(String skills) {
        if (skills == null || skills.isBlank()) {
            return null;
        }
        return String.join(", ", java.util.Arrays.stream(skills.split(","))
                .map(String::trim).filter(s -> !s.isEmpty()).distinct().toList());
    }
}
