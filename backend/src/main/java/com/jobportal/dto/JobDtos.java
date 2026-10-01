package com.jobportal.dto;

import com.jobportal.model.ExperienceLevel;
import com.jobportal.model.JobStatus;
import com.jobportal.model.JobType;
import jakarta.validation.constraints.*;

import java.time.Instant;
import java.util.List;

public final class JobDtos {

    private JobDtos() {
    }

    public record JobRequest(
            @NotBlank @Size(max = 200) String title,
            @NotBlank @Size(max = 20000) String description,
            @NotBlank @Size(max = 200) String location,
            boolean remote,
            @NotNull JobType jobType,
            ExperienceLevel experienceLevel,
            @PositiveOrZero Integer salaryMin,
            @PositiveOrZero Integer salaryMax,
            @Size(max = 30) List<@NotBlank @Size(max = 60) String> skills,
            /* ACTIVE or CLOSED; defaults to ACTIVE. */
            JobStatus status) {

        @AssertTrue(message = "Minimum salary cannot exceed maximum salary")
        public boolean isSalaryRangeValid() {
            return salaryMin == null || salaryMax == null || salaryMin <= salaryMax;
        }
    }

    public record CompanySummary(Long id, String name, String location, String logoUrl, String industry,
                                 String website) {
    }

    public record JobDto(
            Long id,
            String title,
            String description,
            String location,
            boolean remote,
            JobType jobType,
            ExperienceLevel experienceLevel,
            Integer salaryMin,
            Integer salaryMax,
            List<String> skills,
            JobStatus status,
            String removalReason,
            Instant createdAt,
            Instant updatedAt,
            CompanySummary company,
            Long applicationCount,
            Boolean saved,
            Boolean applied) {
    }

    public record JobSearchCriteria(
            String q,
            String location,
            List<JobType> types,
            List<ExperienceLevel> levels,
            Integer minSalary,
            Integer maxSalary,
            List<String> skills,
            Boolean remote) {
    }

    public record AdminJobStatusRequest(@NotNull JobStatus status, @Size(max = 255) String reason) {
    }
}
