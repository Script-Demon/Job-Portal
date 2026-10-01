package com.jobportal.service;

import com.jobportal.dto.ApplicationDtos.ApplicantSummary;
import com.jobportal.dto.ApplicationDtos.ApplicationDto;
import com.jobportal.dto.ApplicationDtos.JobSummary;
import com.jobportal.dto.AuthDtos.UserDto;
import com.jobportal.dto.CompanyDtos.CompanyDto;
import com.jobportal.dto.JobDtos.CompanySummary;
import com.jobportal.dto.JobDtos.JobDto;
import com.jobportal.dto.ProfileDtos.ProfileDto;
import com.jobportal.model.*;

import java.util.ArrayList;

/** Entity → DTO conversions. Must be called inside a transaction (entities have lazy associations). */
public final class DtoMapper {

    private DtoMapper() {
    }

    public static UserDto toUserDto(User u) {
        return new UserDto(u.getId(), u.getEmail(), u.getFullName(), u.getRole(), u.isEnabled(), u.getCreatedAt());
    }

    public static CompanySummary toCompanySummary(Company c) {
        return new CompanySummary(c.getId(), c.getName(), c.getLocation(), c.getLogoUrl(), c.getIndustry(),
                c.getWebsite());
    }

    public static JobDto toJobDto(Job j, Long applicationCount, Boolean saved, Boolean applied) {
        return new JobDto(j.getId(), j.getTitle(), j.getDescription(), j.getLocation(), j.isRemote(),
                j.getJobType(), j.getExperienceLevel(), j.getSalaryMin(), j.getSalaryMax(),
                new ArrayList<>(j.getSkills()), j.getStatus(), j.getRemovalReason(), j.getCreatedAt(),
                j.getUpdatedAt(), toCompanySummary(j.getCompany()), applicationCount, saved, applied);
    }

    public static CompanyDto toCompanyDto(Company c, Long jobCount, boolean includeOwner) {
        User owner = includeOwner ? c.getOwner() : null;
        return new CompanyDto(c.getId(), c.getName(), c.getDescription(), c.getWebsite(), c.getLocation(),
                c.getIndustry(), c.getCompanySize(), c.getLogoUrl(), c.getCreatedAt(),
                owner != null ? owner.getId() : null,
                owner != null ? owner.getFullName() : null,
                owner != null ? owner.getEmail() : null,
                jobCount);
    }

    public static ProfileDto toProfileDto(User u, SeekerProfile p) {
        if (p == null) {
            return new ProfileDto(u.getId(), u.getFullName(), u.getEmail(), null, null, null, null, null, null,
                    null, null, false, null, null);
        }
        return new ProfileDto(u.getId(), u.getFullName(), u.getEmail(), p.getHeadline(), p.getPhone(),
                p.getLocation(), p.getSummary(), p.getSkills(), p.getExperienceYears(), p.getEducation(),
                p.getLinkedinUrl(), p.getResumePath() != null, p.getResumeOriginalName(), p.getResumeUploadedAt());
    }

    public static ApplicationDto toApplicationDto(JobApplication a, SeekerProfile profile) {
        Job j = a.getJob();
        User u = a.getApplicant();
        JobSummary job = new JobSummary(j.getId(), j.getTitle(), j.getCompany().getId(), j.getCompany().getName(),
                j.getLocation(), j.getJobType(), j.getStatus());
        ApplicantSummary applicant = profile == null
                ? new ApplicantSummary(u.getId(), u.getFullName(), u.getEmail(), null, null, null, null, null, null,
                null)
                : new ApplicantSummary(u.getId(), u.getFullName(), u.getEmail(), profile.getHeadline(),
                profile.getPhone(), profile.getLocation(), profile.getSkills(), profile.getExperienceYears(),
                profile.getLinkedinUrl(), profile.getSummary());
        return new ApplicationDto(a.getId(), a.getStatus(), a.getCoverLetter(), a.getAppliedAt(), a.getUpdatedAt(),
                job, applicant, a.getResumePath() != null, a.getResumeOriginalName());
    }
}
