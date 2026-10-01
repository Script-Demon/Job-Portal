package com.jobportal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public final class CompanyDtos {

    private CompanyDtos() {
    }

    private static final String URL_PATTERN = "^$|^https?://.+";

    public record CompanyRequest(
            @NotBlank @Size(max = 200) String name,
            @Size(max = 10000) String description,
            @Size(max = 255) @Pattern(regexp = URL_PATTERN, message = "Must start with http:// or https://") String website,
            @Size(max = 200) String location,
            @Size(max = 120) String industry,
            @Size(max = 60) String companySize,
            @Size(max = 500) @Pattern(regexp = URL_PATTERN, message = "Must start with http:// or https://") String logoUrl) {
    }

    public record CompanyDto(
            Long id,
            String name,
            String description,
            String website,
            String location,
            String industry,
            String companySize,
            String logoUrl,
            Instant createdAt,
            Long ownerId,
            String ownerName,
            String ownerEmail,
            Long jobCount) {
    }
}
