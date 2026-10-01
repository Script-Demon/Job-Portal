package com.jobportal.service;

import com.jobportal.dto.JobDtos.JobSearchCriteria;
import com.jobportal.model.Company;
import com.jobportal.model.Job;
import com.jobportal.model.JobStatus;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public final class JobSpecifications {

    private JobSpecifications() {
    }

    public static Specification<Job> search(JobSearchCriteria c, JobStatus requiredStatus) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (requiredStatus != null) {
                predicates.add(cb.equal(root.get("status"), requiredStatus));
            }

            if (hasText(c.q())) {
                String like = like(c.q());
                Join<Job, Company> company = root.join("company", JoinType.INNER);
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), like),
                        cb.like(cb.lower(root.get("description")), like),
                        cb.like(cb.lower(company.get("name")), like)));
            }

            if (hasText(c.location())) {
                predicates.add(cb.like(cb.lower(root.get("location")), like(c.location())));
            }

            if (c.types() != null && !c.types().isEmpty()) {
                predicates.add(root.get("jobType").in(c.types()));
            }

            if (c.levels() != null && !c.levels().isEmpty()) {
                predicates.add(root.get("experienceLevel").in(c.levels()));
            }

            if (Boolean.TRUE.equals(c.remote())) {
                predicates.add(cb.isTrue(root.get("remote")));
            }

            // Salary filters match on range overlap: a job qualifies if any part of its range fits.
            if (c.minSalary() != null) {
                Expression<Integer> upper = cb.coalesce(root.get("salaryMax"), root.get("salaryMin"));
                predicates.add(cb.greaterThanOrEqualTo(upper, c.minSalary()));
            }
            if (c.maxSalary() != null) {
                Expression<Integer> lower = cb.coalesce(root.get("salaryMin"), root.get("salaryMax"));
                predicates.add(cb.lessThanOrEqualTo(lower, c.maxSalary()));
            }

            if (c.skills() != null && !c.skills().isEmpty()) {
                List<String> wanted = c.skills().stream()
                        .filter(JobSpecifications::hasText)
                        .map(s -> s.trim().toLowerCase(Locale.ROOT))
                        .toList();
                if (!wanted.isEmpty()) {
                    Subquery<Long> sq = query.subquery(Long.class);
                    Root<Job> sub = sq.from(Job.class);
                    Join<Job, String> skill = sub.join("skills");
                    sq.select(sub.get("id"))
                            .where(cb.equal(sub.get("id"), root.get("id")), cb.lower(skill).in(wanted));
                    predicates.add(cb.exists(sq));
                }
            }

            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    /**
     * Ordering as a specification so salary sorts can treat missing salaries as 0 (Postgres sorts NULLs first
     * on DESC). Skipped for count queries.
     */
    public static Specification<Job> sortedBy(String sort) {
        return (root, query, cb) -> {
            Class<?> resultType = query.getResultType();
            if (resultType == Long.class || resultType == long.class) {
                return null;
            }
            Expression<Integer> salary = cb.coalesce(
                    cb.coalesce(root.<Integer>get("salaryMax"), root.<Integer>get("salaryMin")), 0);
            Order newest = cb.desc(root.get("createdAt"));
            switch (sort == null ? "newest" : sort) {
                case "oldest" -> query.orderBy(cb.asc(root.get("createdAt")));
                case "salary_desc" -> query.orderBy(cb.desc(salary), newest);
                case "salary_asc" -> query.orderBy(cb.asc(salary), newest);
                default -> query.orderBy(newest);
            }
            return null;
        };
    }

    private static boolean hasText(String s) {
        return s != null && !s.isBlank();
    }

    private static String like(String s) {
        String escaped = s.trim().toLowerCase(Locale.ROOT).replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
        return "%" + escaped + "%";
    }
}
