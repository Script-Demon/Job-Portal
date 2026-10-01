package com.jobportal.dto;

import com.jobportal.model.ApplicationStatus;
import com.jobportal.model.JobStatus;
import com.jobportal.model.JobType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public final class ApplicationDtos {

    private ApplicationDtos() {
    }

    public record ApplyRequest(@Size(max = 5000) String coverLetter) {
    }

    public record StatusUpdateRequest(@NotNull ApplicationStatus status) {
    }

    public record JobSummary(Long id, String title, Long companyId, String companyName, String location,
                             JobType jobType, JobStatus status) {
    }

    public record ApplicantSummary(Long id, String fullName, String email, String headline, String phone,
                                   String location, String skills, Integer experienceYears, String linkedinUrl,
                                   String summary) {
    }

    public record ApplicationDto(
            Long id,
            ApplicationStatus status,
            String coverLetter,
            Instant appliedAt,
            Instant updatedAt,
            JobSummary job,
            ApplicantSummary applicant,
            boolean hasResume,
            String resumeOriginalName) {
    }
}
