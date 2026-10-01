package com.jobportal.service;

import com.jobportal.dto.CompanyDtos.CompanyDto;
import com.jobportal.dto.CompanyDtos.CompanyRequest;
import com.jobportal.dto.JobDtos.JobDto;
import com.jobportal.dto.PageResponse;
import com.jobportal.exception.ApiException;
import com.jobportal.model.Company;
import com.jobportal.model.JobStatus;
import com.jobportal.model.User;
import com.jobportal.repository.CompanyRepository;
import com.jobportal.repository.JobApplicationRepository;
import com.jobportal.repository.JobRepository;
import com.jobportal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final JobApplicationRepository applicationRepository;
    private final FileStorageService fileStorageService;

    public record PublicCompanyDto(CompanyDto company, List<JobDto> openJobs) {
    }

    @Transactional(readOnly = true)
    public CompanyDto getForOwner(Long ownerId) {
        Company c = companyRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> ApiException.notFound("You have not created a company profile yet"));
        return DtoMapper.toCompanyDto(c, jobRepository.countByCompanyId(c.getId()), false);
    }

    @Transactional
    public CompanyDto upsert(Long ownerId, CompanyRequest req) {
        Company c = companyRepository.findByOwnerId(ownerId).orElseGet(() -> {
            User owner = userRepository.getReferenceById(ownerId);
            Company created = new Company();
            created.setOwner(owner);
            return created;
        });
        c.setName(req.name().trim());
        c.setDescription(blankToNull(req.description()));
        c.setWebsite(blankToNull(req.website()));
        c.setLocation(blankToNull(req.location()));
        c.setIndustry(blankToNull(req.industry()));
        c.setCompanySize(blankToNull(req.companySize()));
        c.setLogoUrl(blankToNull(req.logoUrl()));
        companyRepository.saveAndFlush(c);
        return DtoMapper.toCompanyDto(c, jobRepository.countByCompanyId(c.getId()), false);
    }

    @Transactional(readOnly = true)
    public PublicCompanyDto getPublic(Long companyId) {
        Company c = companyRepository.findById(companyId)
                .orElseThrow(() -> ApiException.notFound("Company not found"));
        List<JobDto> jobs = jobRepository.findByCompanyIdAndStatusOrderByCreatedAtDesc(companyId, JobStatus.ACTIVE)
                .stream().map(j -> DtoMapper.toJobDto(j, null, null, null)).toList();
        return new PublicCompanyDto(DtoMapper.toCompanyDto(c, (long) jobs.size(), false), jobs);
    }

    @Transactional(readOnly = true)
    public PageResponse<CompanyDto> adminList(String q, Pageable pageable) {
        String like = q == null || q.isBlank() ? null : "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
        return PageResponse.of(companyRepository.search(like, pageable),
                c -> DtoMapper.toCompanyDto(c, jobRepository.countByCompanyId(c.getId()), true));
    }

    @Transactional
    public void adminDelete(Long companyId) {
        Company c = companyRepository.findById(companyId)
                .orElseThrow(() -> ApiException.notFound("Company not found"));
        List<String> files = applicationRepository.findResumePathsByCompany(companyId);
        companyRepository.delete(c);
        companyRepository.flush();
        fileStorageService.deleteAllQuietly(files);
    }

    static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
