package com.jobportal.controller;

import com.jobportal.dto.ApplicationDtos.ApplicationDto;
import com.jobportal.dto.ApplicationDtos.ApplyRequest;
import com.jobportal.dto.JobDtos.JobDto;
import com.jobportal.dto.JobDtos.JobSearchCriteria;
import com.jobportal.dto.PageResponse;
import com.jobportal.model.ExperienceLevel;
import com.jobportal.model.JobType;
import com.jobportal.security.AppUserDetails;
import com.jobportal.service.ApplicationService;
import com.jobportal.service.CompanyService;
import com.jobportal.service.CompanyService.PublicCompanyDto;
import com.jobportal.service.JobService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Public job browsing (auth optional) plus the apply action for job seekers. */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;
    private final CompanyService companyService;
    private final ApplicationService applicationService;

    @GetMapping("/jobs")
    public PageResponse<JobDto> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) List<JobType> type,
            @RequestParam(required = false) List<ExperienceLevel> level,
            @RequestParam(required = false) Integer minSalary,
            @RequestParam(required = false) Integer maxSalary,
            @RequestParam(required = false) List<String> skills,
            @RequestParam(required = false) Boolean remote,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal AppUserDetails viewer) {
        JobSearchCriteria criteria = new JobSearchCriteria(q, location, type, level, minSalary, maxSalary, skills,
                remote);
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50));
        return jobService.search(criteria, sort, pageable, viewer);
    }

    @GetMapping("/jobs/{id}")
    public JobDto get(@PathVariable Long id, @AuthenticationPrincipal AppUserDetails viewer) {
        return jobService.getForViewer(id, viewer);
    }

    @PostMapping("/jobs/{id}/apply")
    @ResponseStatus(HttpStatus.CREATED)
    public ApplicationDto apply(@PathVariable Long id, @Valid @RequestBody(required = false) ApplyRequest req,
                                @AuthenticationPrincipal AppUserDetails user) {
        return applicationService.apply(user.getId(), id, req);
    }

    @GetMapping("/companies/{id}")
    public PublicCompanyDto company(@PathVariable Long id) {
        return companyService.getPublic(id);
    }
}
