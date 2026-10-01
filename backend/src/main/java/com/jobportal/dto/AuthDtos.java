package com.jobportal.dto;

import com.jobportal.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record RegisterRequest(
            @NotBlank @Email @Size(max = 255) String email,
            @NotBlank @Size(min = 8, max = 100, message = "Password must be at least 8 characters") String password,
            @NotBlank @Size(max = 120) String fullName,
            @NotNull Role role,
            /* Optional: company name for employers, creates a starter company profile. */
            @Size(max = 200) String companyName) {
    }

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {
    }

    public record UserDto(Long id, String email, String fullName, Role role, boolean enabled, Instant createdAt) {
    }

    public record AuthResponse(String token, UserDto user) {
    }
}
