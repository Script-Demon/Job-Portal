package com.jobportal.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.Instant;

@Entity
@Table(name = "seeker_profiles")
@Getter
@Setter
@NoArgsConstructor
public class SeekerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;

    private String headline;
    private String phone;
    private String location;

    @Column(columnDefinition = "TEXT")
    private String summary;

    /** Comma-separated list of skills. */
    @Column(length = 1000)
    private String skills;

    private Integer experienceYears;

    @Column(columnDefinition = "TEXT")
    private String education;

    private String linkedinUrl;

    private String resumePath;
    private String resumeOriginalName;
    private String resumeContentType;
    private Instant resumeUploadedAt;

    public SeekerProfile(User user) {
        this.user = user;
    }
}
