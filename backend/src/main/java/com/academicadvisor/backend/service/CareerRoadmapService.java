package com.academicadvisor.backend.service;

import com.academicadvisor.backend.entity.Careerroadmap;
import com.academicadvisor.backend.entity.User;
import com.academicadvisor.backend.repository.CareerRoadmapRepository;
import com.academicadvisor.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CareerRoadmapService {

    private final CareerRoadmapRepository roadmapRepo;
    private final UserRepository userRepository;

    public User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public Map<String, Object> getLatestRoadmap() {
        User user = getCurrentUser();
        List<Careerroadmap> roadmaps = roadmapRepo.findByUserId(user.getId());

        if (roadmaps.isEmpty()) {
            return Map.of("exists", false);
        }

        Careerroadmap latest = roadmaps.get(roadmaps.size() - 1);
        return Map.of(
                "exists",             true,
                "id",                 latest.getId(),
                "careerTitle",        latest.getCareerTitle(),
                "confidencePercent",  latest.getConfidencePercent(),
                "roadmapType",        latest.getRoadmapType() != null ? latest.getRoadmapType() : "career",
                "roadmapJson",        latest.getRoadmapJson() != null ? latest.getRoadmapJson() : "{}",
                "skillsAnalysisJson", latest.getSkillsAnalysisJson() != null ? latest.getSkillsAnalysisJson() : "{}",
                "progressJson",       latest.getProgressJson() != null ? latest.getProgressJson() : "{}"
        );
    }

    public Careerroadmap saveRoadmap(Map<String, Object> body) {
        User user = getCurrentUser();

        String careerTitle        = (String) body.getOrDefault("careerTitle",     "Unknown");
        Integer confidencePct     = Integer.valueOf(body.getOrDefault("confidencePercent", 0).toString());
        String roadmapJson        = (String) body.getOrDefault("roadmapJson",    "{}");
        String skillsAnalysisJson = (String) body.getOrDefault("skillsAnalysisJson", "{}");
        String roadmapType        = (String) body.getOrDefault("roadmapType",    "career");

        Careerroadmap roadmap = Careerroadmap.builder()
                .user(user)
                .careerTitle(careerTitle)
                .confidencePercent(confidencePct)
                .roadmapJson(roadmapJson)
                .skillsAnalysisJson(skillsAnalysisJson)
                .roadmapType(roadmapType)
                .progressJson("{}")
                .build();

        return roadmapRepo.save(roadmap);
    }

    public Careerroadmap saveProgress(Long id, Map<String, String> body) {
        User user = getCurrentUser();

        Careerroadmap roadmap = roadmapRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Roadmap not found"));

        if (!roadmap.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }

        roadmap.setProgressJson(body.getOrDefault("progressJson", "{}"));
        return roadmapRepo.save(roadmap);
    }

    public List<Map<String, Object>> getAllRoadmaps() {
        User user = getCurrentUser();
        List<Careerroadmap> roadmaps = roadmapRepo.findByUserId(user.getId());
        return roadmaps.stream().map(r -> {
            // Using a mutable map to handle possible nulls
            java.util.Map<String, Object> m = new java.util.HashMap<>();
            m.put("id", r.getId());
            m.put("careerTitle", r.getCareerTitle());
            m.put("roadmapType", r.getRoadmapType() != null ? r.getRoadmapType() : "career");
            m.put("createdAt", r.getCreatedAt() != null ? r.getCreatedAt().toString() : "");
            m.put("roadmapJson", r.getRoadmapJson() != null ? r.getRoadmapJson() : "{}");
            m.put("progressJson", r.getProgressJson() != null ? r.getProgressJson() : "{}");
            return m;
        }).collect(java.util.stream.Collectors.toList());
    }

    public void deleteRoadmap(Long id) {
        User user = getCurrentUser();
        Careerroadmap roadmap = roadmapRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Roadmap not found"));
        if (!roadmap.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }
        roadmapRepo.delete(roadmap);
    }

    public void clearAllRoadmaps() {
        User user = getCurrentUser();
        List<Careerroadmap> existing = roadmapRepo.findByUserId(user.getId());
        if (!existing.isEmpty()) {
            roadmapRepo.deleteAll(existing);
        }
    }
}
