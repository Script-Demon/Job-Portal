package com.jobportal.service;

import com.jobportal.dto.AuthDtos.AuthResponse;
import com.jobportal.dto.AuthDtos.LoginRequest;
import com.jobportal.dto.AuthDtos.RegisterRequest;
import com.jobportal.dto.AuthDtos.UserDto;
import com.jobportal.exception.ApiException;
import com.jobportal.model.Company;
import com.jobportal.model.Role;
import com.jobportal.model.SeekerProfile;
import com.jobportal.model.User;
import com.jobportal.repository.CompanyRepository;
import com.jobportal.repository.SeekerProfileRepository;
import com.jobportal.repository.UserRepository;
import com.jobportal.security.AppUserDetails;
import com.jobportal.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final SeekerProfileRepository profileRepository;
    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (req.role() == Role.ADMIN) {
            throw ApiException.forbidden("Admin accounts cannot be self-registered");
        }
        String email = req.email().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("An account with this email already exists");
        }
        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(req.password()));
        user.setFullName(req.fullName().trim());
        user.setRole(req.role());
        userRepository.save(user);

        if (req.role() == Role.JOB_SEEKER) {
            profileRepository.save(new SeekerProfile(user));
        } else if (req.companyName() != null && !req.companyName().isBlank()) {
            Company company = new Company();
            company.setOwner(user);
            company.setName(req.companyName().trim());
            companyRepository.save(company);
        }

        AppUserDetails principal = new AppUserDetails(user);
        return new AuthResponse(jwtService.generateToken(principal), DtoMapper.toUserDto(user));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.email().trim(), req.password()));
        AppUserDetails principal = (AppUserDetails) auth.getPrincipal();
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> ApiException.notFound("User not found"));
        return new AuthResponse(jwtService.generateToken(principal), DtoMapper.toUserDto(user));
    }

    @Transactional(readOnly = true)
    public UserDto me(Long userId) {
        return userRepository.findById(userId)
                .map(DtoMapper::toUserDto)
                .orElseThrow(() -> ApiException.notFound("User not found"));
    }
}
