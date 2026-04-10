package com.academicadvisor.backend.repository;

import com.academicadvisor.backend.entity.SuggesterHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SuggesterHistoryRepository extends JpaRepository<SuggesterHistory, Long> {
    List<SuggesterHistory> findByUserIdOrderByCreatedAtDesc(Long userId);
    void deleteByUserId(Long userId);
}
