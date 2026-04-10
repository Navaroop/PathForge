package com.academicadvisor.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "attendance_schedule")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private int mon;

    @Column(nullable = false)
    private int tue;

    @Column(nullable = false)
    private int wed;

    @Column(nullable = false)
    private int thu;

    @Column(nullable = false)
    private int fri;

    @Column(nullable = false)
    private int sat;

    @Column(nullable = false)
    private int sun;
}
