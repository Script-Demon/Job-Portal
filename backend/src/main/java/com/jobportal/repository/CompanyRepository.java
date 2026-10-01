package com.jobportal.repository;

import com.jobportal.model.Company;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CompanyRepository extends JpaRepository<Company, Long> {

    Optional<Company> findByOwnerId(Long ownerId);

    @Query(value = """
            select c from Company c join fetch c.owner o
            where (:q is null or lower(c.name) like :q or lower(o.email) like :q)
            """,
            countQuery = """
            select count(c) from Company c join c.owner o
            where (:q is null or lower(c.name) like :q or lower(o.email) like :q)
            """)
    Page<Company> search(@Param("q") String q, Pageable pageable);
}
