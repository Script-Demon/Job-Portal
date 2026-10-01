package com.jobportal.dto;

import jakarta.validation.constraints.*;

import java.time.Instant;

public final class ProfileDtos {

    private ProfileDtos() {
    }

    public record ProfileRequest(
            @NotBlank @Size(max = 120) String fullName,
            @Size(max = 200) String headline,
            @Size(max = 40) String phone,
            @Size(max = 200) String location,
            @Size(max = 5000) String summary,
            @Size(max = 1000) String skills,
            @Min(0) @Max(60) Integer experienceYears,
            @Size(max = 3000) String education,
            @Size(max = 255) @Pattern(regexp = "^$|^https?://.+", message = "Must start with http:// or https://")
            String linkedinUrl) {
    }

    public record ProfileDto(
            Long userId,
            String fullName,
            String email,
            String headline,
            String phone,
            String location,
            String summary,
            String skills,
            Integer experienceYears,
            String education,
            String linkedinUrl,
            boolean hasResume,
            String resumeOriginalName,
            Instant resumeUploadedAt) {
    }
}
