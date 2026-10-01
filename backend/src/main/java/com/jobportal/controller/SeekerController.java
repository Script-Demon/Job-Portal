package com.jobportal.controller;

import com.jobportal.dto.ApplicationDtos.ApplicationDto;
import com.jobportal.dto.JobDtos.JobDto;
import com.jobportal.dto.ProfileDtos.ProfileDto;
import com.jobportal.dto.ProfileDtos.ProfileRequest;
import com.jobportal.security.AppUserDetails;
import com.jobportal.service.ApplicationService;
import com.jobportal.service.SeekerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/seeker")
@RequiredArgsConstructor
public class SeekerController {

    private final SeekerService seekerService;
    private final ApplicationService applicationService;

    @GetMapping("/profile")
    public ProfileDto profile(@AuthenticationPrincipal AppUserDetails user) {
        return seekerService.getProfile(user.getId());
    }

    @PutMapping("/profile")
    public ProfileDto updateProfile(@AuthenticationPrincipal AppUserDetails user,
                                    @Valid @RequestBody ProfileRequest req) {
        return seekerService.updateProfile(user.getId(), req);
    }

    @PostMapping(value = "/profile/resume", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ProfileDto uploadResume(@AuthenticationPrincipal AppUserDetails user,
                                   @RequestParam("file") MultipartFile file) {
        return seekerService.uploadResume(user.getId(), file);
    }

    @GetMapping("/profile/resume")
    public ResponseEntity<Resource> downloadResume(@AuthenticationPrincipal AppUserDetails user) {
        return Downloads.attachment(seekerService.downloadOwnResume(user.getId()));
    }

    @DeleteMapping("/profile/resume")
    public ProfileDto deleteResume(@AuthenticationPrincipal AppUserDetails user) {
        return seekerService.deleteResume(user.getId());
    }

    @GetMapping("/applications")
    public List<ApplicationDto> applications(@AuthenticationPrincipal AppUserDetails user) {
        return applicationService.listForSeeker(user.getId());
    }

    @PatchMapping("/applications/{id}/withdraw")
    public ApplicationDto withdraw(@AuthenticationPrincipal AppUserDetails user, @PathVariable Long id) {
        return applicationService.withdraw(user.getId(), id);
    }

    @GetMapping("/saved-jobs")
    public List<JobDto> savedJobs(@AuthenticationPrincipal AppUserDetails user) {
        return seekerService.savedJobs(user.getId());
    }

    @PutMapping("/saved-jobs/{jobId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void saveJob(@AuthenticationPrincipal AppUserDetails user, @PathVariable Long jobId) {
        seekerService.saveJob(user.getId(), jobId);
    }

    @DeleteMapping("/saved-jobs/{jobId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unsaveJob(@AuthenticationPrincipal AppUserDetails user, @PathVariable Long jobId) {
        seekerService.unsaveJob(user.getId(), jobId);
    }
}
