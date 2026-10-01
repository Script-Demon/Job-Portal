package com.jobportal.controller;

import com.jobportal.dto.AuthDtos.AuthResponse;
import com.jobportal.dto.AuthDtos.LoginRequest;
import com.jobportal.dto.AuthDtos.RegisterRequest;
import com.jobportal.dto.AuthDtos.UserDto;
import com.jobportal.security.AppUserDetails;
import com.jobportal.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest req) {
        return authService.register(req);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    @GetMapping("/me")
    public UserDto me(@AuthenticationPrincipal AppUserDetails user) {
        return authService.me(user.getId());
    }
}
