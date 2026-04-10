package com.academicadvisor.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "career_roadmaps")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Careerroadmap {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Which user this roadmap belongs to
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String careerTitle;

    @Column(nullable = false)
    private Integer confidencePercent;

    // Full AI-generated roadmap stored as JSON string
    @Column(columnDefinition = "LONGTEXT")
    private String roadmapJson;

    // AI analysis results
    @Column(columnDefinition = "LONGTEXT")
    private String reasonsJson;

    @Column(columnDefinition = "LONGTEXT")
    private String strengthsJson;

    @Column(columnDefinition = "LONGTEXT")
    private String focusAreasJson;

    @Column(columnDefinition = "LONGTEXT")
    private String skillsAnalysisJson;

    // Track which weeks user has completed — stored as JSON
    @Column(columnDefinition = "LONGTEXT")
    private String progressJson;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime updatedAt;
    
    @Column
    private String roadmapType;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
