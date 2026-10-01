package com.jobportal.repository;

import com.jobportal.model.SavedJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SavedJobRepository extends JpaRepository<SavedJob, Long> {

    List<SavedJob> findByUserIdOrderBySavedAtDesc(Long userId);

    Optional<SavedJob> findByUserIdAndJobId(Long userId, Long jobId);

    boolean existsByUserIdAndJobId(Long userId, Long jobId);

    @Query("select s.job.id from SavedJob s where s.user.id = :userId")
    List<Long> findJobIdsByUser(@Param("userId") Long userId);
}
