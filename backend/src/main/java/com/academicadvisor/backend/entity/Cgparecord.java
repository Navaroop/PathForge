package com.academicadvisor.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "cgpa_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cgparecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String semesterName;

    @Column(nullable = false)
    private Double gpa;

    @Column
    private Double cgpa;

    // Full subjects array stored as JSON — e.g. [{name,credits,grade}, ...]
    // Allows restoring the complete semester state on page reload
    @Column(columnDefinition = "TEXT")
    private String subjectsJson;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime updatedAt;

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