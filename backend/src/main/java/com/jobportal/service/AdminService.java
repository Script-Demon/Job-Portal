package com.jobportal.service;

import com.jobportal.dto.AdminDtos.StatsDto;
import com.jobportal.dto.AuthDtos.UserDto;
import com.jobportal.dto.PageResponse;
import com.jobportal.exception.ApiException;
import com.jobportal.model.*;
import com.jobportal.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final JobRepository jobRepository;
    private final JobApplicationRepository applicationRepository;
    private final SeekerProfileRepository profileRepository;
    private final FileStorageService fileStorageService;

    @Transactional(readOnly = true)
    public StatsDto stats() {
        Instant monthAgo = Instant.now().minus(Duration.ofDays(30));

        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (ApplicationStatus s : ApplicationStatus.values()) {
            byStatus.put(s.name(), 0L);
        }
        applicationRepository.countGroupedByStatus()
                .forEach(r -> byStatus.put(((ApplicationStatus) r[0]).name(), (Long) r[1]));

        Map<String, Long> byType = new LinkedHashMap<>();
        for (JobType t : JobType.values()) {
            byType.put(t.name(), 0L);
        }
        jobRepository.countGroupedByType().forEach(r -> byType.put(((JobType) r[0]).name(), (Long) r[1]));

        return new StatsDto(
                userRepository.count(),
                userRepository.countByRole(Role.JOB_SEEKER),
                userRepository.countByRole(Role.EMPLOYER),
                userRepository.countByRole(Role.ADMIN),
                companyRepository.count(),
                jobRepository.count(),
                jobRepository.countByStatus(JobStatus.ACTIVE),
                jobRepository.countByStatus(JobStatus.CLOSED),
                jobRepository.countByStatus(JobStatus.REMOVED),
                applicationRepository.count(),
                userRepository.countByCreatedAtAfter(monthAgo),
                jobRepository.countByCreatedAtAfter(monthAgo),
                byStatus,
                byType);
    }

    @Transactional(readOnly = true)
    public PageResponse<UserDto> users(String q, Role role, Pageable pageable) {
        String like = q == null || q.isBlank() ? null : "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
        return PageResponse.of(userRepository.search(like, role, pageable), DtoMapper::toUserDto);
    }

    @Transactional
    public UserDto setEnabled(Long adminId, Long userId, boolean enabled) {
        if (adminId.equals(userId)) {
            throw ApiException.badRequest("You cannot change your own account status");
        }
        User user = userRepository.findById(userId).orElseThrow(() -> ApiException.notFound("User not found"));
        user.setEnabled(enabled);
        return DtoMapper.toUserDto(user);
    }

    @Transactional
    public void deleteUser(Long adminId, Long userId) {
        if (adminId.equals(userId)) {
            throw ApiException.badRequest("You cannot delete your own account");
        }
        User user = userRepository.findById(userId).orElseThrow(() -> ApiException.notFound("User not found"));

        List<String> files = new ArrayList<>(applicationRepository.findResumePathsByApplicant(userId));
        profileRepository.findByUserId(userId).map(SeekerProfile::getResumePath).ifPresent(files::add);
        companyRepository.findByOwnerId(userId)
                .ifPresent(c -> files.addAll(applicationRepository.findResumePathsByCompany(c.getId())));

        // Profile, company, jobs, applications and saved jobs are removed by ON DELETE CASCADE.
        userRepository.delete(user);
        userRepository.flush();
        fileStorageService.deleteAllQuietly(files);
    }
}
