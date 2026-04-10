package com.academicadvisor.backend.service;

import com.academicadvisor.backend.entity.SuggesterHistory;
import com.academicadvisor.backend.entity.SuggesterSaved;
import com.academicadvisor.backend.entity.User;
import com.academicadvisor.backend.repository.SuggesterHistoryRepository;
import com.academicadvisor.backend.repository.SuggesterSavedRepository;
import com.academicadvisor.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class SubjectSuggesterService {

    private final SuggesterHistoryRepository historyRepo;
    private final SuggesterSavedRepository savedRepo;
    private final UserRepository userRepository;

    public User getCurrentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        String email = auth.getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }

    public List<SuggesterHistory> getHistory() {
        User user = getCurrentUser();
        return historyRepo.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    public SuggesterHistory saveHistory(Map<String, Object> body) {
        User user = getCurrentUser();

        SuggesterHistory history = SuggesterHistory.builder()
                .user(user)
                .query((String) body.getOrDefault("query", ""))
                .fileNamesJson((String) body.getOrDefault("fileNamesJson", "[]"))
                .suggestionsCount((Integer) body.getOrDefault("suggestionsCount", 0))
                .alternativesCount((Integer) body.getOrDefault("alternativesCount", 0))
                .resultsJson((String) body.getOrDefault("resultsJson", "{}"))
                .build();

        return historyRepo.save(history);
    }

    public void clearHistory() {
        User user = getCurrentUser();
        historyRepo.deleteByUserId(user.getId());
    }

    public void deleteHistory(Long id) {
        User user = getCurrentUser();
        SuggesterHistory history = historyRepo.findById(id).orElseThrow();
        if (history.getUser().getId().equals(user.getId())) {
            historyRepo.delete(history);
        } else {
            throw new RuntimeException("Access denied");
        }
    }

    public List<SuggesterSaved> getSaved() {
        User user = getCurrentUser();
        return savedRepo.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    public SuggesterSaved addSaved(Map<String, String> body) {
        User user = getCurrentUser();
        String subjectName = body.get("subjectName");
        String source = body.getOrDefault("source", "document");

        // Prevent duplicates
        boolean exists = savedRepo.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .anyMatch(s -> s.getSubjectName().equals(subjectName) && s.getSource().equals(source));

        if (exists) {
            throw new RuntimeException("Duplicate subject save attempt");
        }

        SuggesterSaved saved = SuggesterSaved.builder()
                .user(user)
                .subjectName(subjectName)
                .source(source)
                .build();

        return savedRepo.save(saved);
    }

    public void clearSaved() {
        User user = getCurrentUser();
        savedRepo.deleteByUserId(user.getId());
    }

    public void deleteSaved(Long id) {
        User user = getCurrentUser();
        SuggesterSaved saved = savedRepo.findById(id).orElseThrow();
        if (saved.getUser().getId().equals(user.getId())) {
            savedRepo.delete(saved);
        } else {
            throw new RuntimeException("Access denied");
        }
    }
}
