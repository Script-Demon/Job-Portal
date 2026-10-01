package com.jobportal.repository;

import com.jobportal.model.Job;
import com.jobportal.model.JobStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;

public interface JobRepository extends JpaRepository<Job, Long>, JpaSpecificationExecutor<Job> {

    List<Job> findByCompanyIdOrderByCreatedAtDesc(Long companyId);

    List<Job> findByCompanyIdAndStatusOrderByCreatedAtDesc(Long companyId, JobStatus status);

    long countByStatus(JobStatus status);

    long countByCompanyId(Long companyId);

    long countByCreatedAtAfter(Instant since);

    @Query("select j.jobType, count(j) from Job j group by j.jobType")
    List<Object[]> countGroupedByType();
}
