package com.academicadvisor.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "suggester_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SuggesterHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User user;

    @Column(nullable = false, length = 1000)
    private String query;

    @Column(columnDefinition = "TEXT")
    private String fileNamesJson;

    @Column
    private Integer suggestionsCount;

    @Column
    private Integer alternativesCount;

    @Column(columnDefinition = "LONGTEXT")
    private String resultsJson;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
