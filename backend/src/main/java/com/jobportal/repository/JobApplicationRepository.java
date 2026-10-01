package com.jobportal.repository;

import com.jobportal.model.JobApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {

    Optional<JobApplication> findByJobIdAndApplicantId(Long jobId, Long applicantId);

    List<JobApplication> findByApplicantIdOrderByAppliedAtDesc(Long applicantId);

    List<JobApplication> findByJobIdOrderByAppliedAtDesc(Long jobId);

    long countByJobCompanyId(Long companyId);

    @Query("select a.job.id from JobApplication a where a.applicant.id = :userId and a.status <> com.jobportal.model.ApplicationStatus.WITHDRAWN")
    List<Long> findActiveJobIdsByApplicant(@Param("userId") Long userId);

    @Query("select a.job.id, count(a) from JobApplication a where a.job.id in :jobIds group by a.job.id")
    List<Object[]> countByJobIds(@Param("jobIds") Collection<Long> jobIds);

    @Query("select a.status, count(a) from JobApplication a group by a.status")
    List<Object[]> countGroupedByStatus();

    @Query("select a.resumePath from JobApplication a where a.applicant.id = :userId and a.resumePath is not null")
    List<String> findResumePathsByApplicant(@Param("userId") Long userId);

    @Query("select a.resumePath from JobApplication a where a.job.company.id = :companyId and a.resumePath is not null")
    List<String> findResumePathsByCompany(@Param("companyId") Long companyId);

    @Query("select a.resumePath from JobApplication a where a.job.id = :jobId and a.resumePath is not null")
    List<String> findResumePathsByJob(@Param("jobId") Long jobId);
}
