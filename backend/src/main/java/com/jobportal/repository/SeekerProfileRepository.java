package com.jobportal.repository;

import com.jobportal.model.SeekerProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface SeekerProfileRepository extends JpaRepository<SeekerProfile, Long> {

    Optional<SeekerProfile> findByUserId(Long userId);

    List<SeekerProfile> findByUserIdIn(Collection<Long> userIds);
}
