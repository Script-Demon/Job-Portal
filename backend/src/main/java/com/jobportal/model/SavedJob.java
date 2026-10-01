package com.jobportal.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.Instant;

@Entity
@Table(name = "saved_jobs", uniqueConstraints = {
        @UniqueConstraint(name = "uk_saved_job_user_job", columnNames = {"user_id", "job_id"})
})
@Getter
@Setter
@NoArgsConstructor
public class SavedJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Job job;

    @Column(nullable = false)
    private Instant savedAt;

    public SavedJob(User user, Job job) {
        this.user = user;
        this.job = job;
    }

    @PrePersist
    void onCreate() {
        savedAt = Instant.now();
    }
}
