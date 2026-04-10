package com.academicadvisor.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "subjects")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String department;

    @Column(nullable = false)
    private Integer semester;

    @Column(nullable = false)
    private Integer credits;

    @Column(nullable = false)
    private String domain;

    @Column(nullable = false)
    private String difficulty;

    @Column(length = 500)
    private String description;

    @Column
    private String prerequisites;

    @Column
    private String alternative;
}
