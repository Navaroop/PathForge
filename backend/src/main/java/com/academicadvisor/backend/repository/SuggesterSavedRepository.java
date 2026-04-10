package com.academicadvisor.backend.repository;

import com.academicadvisor.backend.entity.SuggesterSaved;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SuggesterSavedRepository extends JpaRepository<SuggesterSaved, Long> {
    List<SuggesterSaved> findByUserIdOrderByCreatedAtDesc(Long userId);
    void deleteByUserId(Long userId);
}
