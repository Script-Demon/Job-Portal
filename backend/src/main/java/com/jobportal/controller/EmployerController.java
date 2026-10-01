package com.jobportal.controller;

import com.jobportal.dto.ApplicationDtos.ApplicationDto;
import com.jobportal.dto.ApplicationDtos.StatusUpdateRequest;
import com.jobportal.dto.CompanyDtos.CompanyDto;
import com.jobportal.dto.CompanyDtos.CompanyRequest;
import com.jobportal.dto.JobDtos.JobDto;
import com.jobportal.dto.JobDtos.JobRequest;
import com.jobportal.security.AppUserDetails;
import com.jobportal.service.ApplicationService;
import com.jobportal.service.CompanyService;
import com.jobportal.service.JobService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employer")
@RequiredArgsConstructor
public class EmployerController {

    private final CompanyService companyService;
    private final JobService jobService;
    private final ApplicationService applicationService;

    // ---------- Company ----------

    @GetMapping("/company")
    public CompanyDto company(@AuthenticationPrincipal AppUserDetails user) {
        return companyService.getForOwner(user.getId());
    }

    @PutMapping("/company")
    public CompanyDto saveCompany(@AuthenticationPrincipal AppUserDetails user,
                                  @Valid @RequestBody CompanyRequest req) {
        return companyService.upsert(user.getId(), req);
    }

    // ---------- Jobs ----------

    @GetMapping("/jobs")
    public List<JobDto> jobs(@AuthenticationPrincipal AppUserDetails user) {
        return jobService.listForEmployer(user.getId());
    }

    @GetMapping("/jobs/{id}")
    public JobDto job(@AuthenticationPrincipal AppUserDetails user, @PathVariable Long id) {
        return jobService.getForEmployer(user.getId(), id);
    }

    @PostMapping("/jobs")
    @ResponseStatus(HttpStatus.CREATED)
    public JobDto createJob(@AuthenticationPrincipal AppUserDetails user, @Valid @RequestBody JobRequest req) {
        return jobService.create(user.getId(), req);
    }

    @PutMapping("/jobs/{id}")
    public JobDto updateJob(@AuthenticationPrincipal AppUserDetails user, @PathVariable Long id,
                            @Valid @RequestBody JobRequest req) {
        return jobService.update(user.getId(), id, req);
    }

    @DeleteMapping("/jobs/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteJob(@AuthenticationPrincipal AppUserDetails user, @PathVariable Long id) {
        jobService.delete(user.getId(), id);
    }

    // ---------- Applicants ----------

    @GetMapping("/jobs/{id}/applications")
    public List<ApplicationDto> applicants(@AuthenticationPrincipal AppUserDetails user, @PathVariable Long id) {
        return applicationService.listForJob(user.getId(), id);
    }

    @PatchMapping("/applications/{id}/status")
    public ApplicationDto updateStatus(@AuthenticationPrincipal AppUserDetails user, @PathVariable Long id,
                                       @Valid @RequestBody StatusUpdateRequest req) {
        return applicationService.updateStatus(user.getId(), id, req.status());
    }

    @GetMapping("/applications/{id}/resume")
    public ResponseEntity<Resource> resume(@AuthenticationPrincipal AppUserDetails user, @PathVariable Long id) {
        return Downloads.attachment(applicationService.downloadResume(user.getId(), id));
    }
}
