package com.jobportal.dto;

import java.util.Map;

public final class AdminDtos {

    private AdminDtos() {
    }

    public record UserStatusRequest(boolean enabled) {
    }

    public record StatsDto(
            long totalUsers,
            long jobSeekers,
            long employers,
            long admins,
            long totalCompanies,
            long totalJobs,
            long activeJobs,
            long closedJobs,
            long removedJobs,
            long totalApplications,
            long newUsersLast30Days,
            long newJobsLast30Days,
            Map<String, Long> applicationsByStatus,
            Map<String, Long> jobsByType) {
    }
}
