package com.academicadvisor.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "attendance_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Which user this attendance belongs to
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String subjectName;

    @Column(nullable = false)
    private Integer attendedClasses;

    @Column(nullable = false)
    private Integer totalClasses;

    // Calculated attendance percentage
    @Column
    private Double attendancePercent;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt   = LocalDateTime.now();
        updatedAt   = LocalDateTime.now();
        calculatePercent();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        calculatePercent();
    }

    private void calculatePercent() {
        if (totalClasses != null && totalClasses > 0) {
            attendancePercent = (double) attendedClasses / totalClasses * 100;
        }
    }
}
