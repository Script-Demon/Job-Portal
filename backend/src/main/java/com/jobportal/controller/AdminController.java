package com.jobportal.controller;

import com.jobportal.dto.AdminDtos.StatsDto;
import com.jobportal.dto.AdminDtos.UserStatusRequest;
import com.jobportal.dto.AuthDtos.UserDto;
import com.jobportal.dto.CompanyDtos.CompanyDto;
import com.jobportal.dto.JobDtos.AdminJobStatusRequest;
import com.jobportal.dto.JobDtos.JobDto;
import com.jobportal.dto.PageResponse;
import com.jobportal.model.JobStatus;
import com.jobportal.model.Role;
import com.jobportal.security.AppUserDetails;
import com.jobportal.service.AdminService;
import com.jobportal.service.CompanyService;
import com.jobportal.service.JobService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final CompanyService companyService;
    private final JobService jobService;

    @GetMapping("/stats")
    public StatsDto stats() {
        return adminService.stats();
    }

    // ---------- Users ----------

    @GetMapping("/users")
    public PageResponse<UserDto> users(@RequestParam(required = false) String q,
                                       @RequestParam(required = false) Role role,
                                       @RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "20") int size) {
        return adminService.users(q, role, pageable(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    @PatchMapping("/users/{id}/status")
    public UserDto setUserStatus(@AuthenticationPrincipal AppUserDetails admin, @PathVariable Long id,
                                 @RequestBody UserStatusRequest req) {
        return adminService.setEnabled(admin.getId(), id, req.enabled());
    }

    @DeleteMapping("/users/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(@AuthenticationPrincipal AppUserDetails admin, @PathVariable Long id) {
        adminService.deleteUser(admin.getId(), id);
    }

    // ---------- Companies ----------

    @GetMapping("/companies")
    public PageResponse<CompanyDto> companies(@RequestParam(required = false) String q,
                                              @RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "20") int size) {
        return companyService.adminList(q, pageable(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    @DeleteMapping("/companies/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCompany(@PathVariable Long id) {
        companyService.adminDelete(id);
    }

    // ---------- Jobs ----------

    @GetMapping("/jobs")
    public PageResponse<JobDto> jobs(@RequestParam(required = false) String q,
                                     @RequestParam(required = false) JobStatus status,
                                     @RequestParam(defaultValue = "0") int page,
                                     @RequestParam(defaultValue = "20") int size) {
        return jobService.adminList(q, status, pageable(page, size, Sort.unsorted()));
    }

    @PatchMapping("/jobs/{id}/status")
    public JobDto setJobStatus(@PathVariable Long id, @Valid @RequestBody AdminJobStatusRequest req) {
        return jobService.adminSetStatus(id, req);
    }

    @DeleteMapping("/jobs/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteJob(@PathVariable Long id) {
        jobService.adminDelete(id);
    }

    private static Pageable pageable(int page, int size, Sort sort) {
        return PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), sort);
    }
}
