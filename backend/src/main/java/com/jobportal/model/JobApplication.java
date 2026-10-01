package com.jobportal.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.Instant;

@Entity
@Table(name = "applications", uniqueConstraints = {
        @UniqueConstraint(name = "uk_application_job_applicant", columnNames = {"job_id", "applicant_id"})
})
@Getter
@Setter
@NoArgsConstructor
public class JobApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "applicant_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User applicant;

    @Column(columnDefinition = "TEXT")
    private String coverLetter;

    /** Snapshot of the applicant's resume at the time of applying. */
    private String resumePath;
    private String resumeOriginalName;
    private String resumeContentType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ApplicationStatus status = ApplicationStatus.APPLIED;

    @Column(nullable = false)
    private Instant appliedAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        appliedAt = Instant.now();
        updatedAt = appliedAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
