package com.academicadvisor.backend.controller;

import com.academicadvisor.backend.service.CareerRoadmapService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/roadmap")
@RequiredArgsConstructor
public class CareerRoadmapController {

    private final CareerRoadmapService roadmapService;

    // ── GET /api/roadmap/latest ───────────────────────────────
    // Returns the most recently saved roadmap for the user
    @GetMapping("/latest")
    public ResponseEntity<?> getLatest() {
        return ResponseEntity.ok(roadmapService.getLatestRoadmap());
    }

    // ── POST /api/roadmap ─────────────────────────────────────
    // Save a newly generated roadmap
    @PostMapping
    public ResponseEntity<?> save(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(roadmapService.saveRoadmap(body));
    }

    // ── PUT /api/roadmap/{id}/progress ────────────────────────
    // Save which skills the user has checked off
    @PutMapping("/{id}/progress")
    public ResponseEntity<?> saveProgress(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(roadmapService.saveProgress(id, body));
        } catch (RuntimeException e) {
            if ("Access denied".equals(e.getMessage())) {
                 return ResponseEntity.status(403).body(Map.of("message", e.getMessage()));
            }
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ── GET /api/roadmap/all ──────────────────────────────────
    // Returns all saved roadmaps for the user
    @GetMapping("/all")
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(roadmapService.getAllRoadmaps());
    }

    // ── DELETE /api/roadmap/{id} ──────────────────────────────
    // Delete a specific roadmap by ID
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteById(@PathVariable Long id) {
        try {
            roadmapService.deleteRoadmap(id);
            return ResponseEntity.ok(Map.of("message", "Roadmap deleted"));
        } catch (RuntimeException e) {
             if ("Access denied".equals(e.getMessage())) {
                 return ResponseEntity.status(403).body(Map.of("message", e.getMessage()));
             }
             return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ── DELETE /api/roadmap ───────────────────────────────────
    // Clear all user's roadmaps (retake)
    @DeleteMapping
    public ResponseEntity<?> deleteAll() {
        roadmapService.clearAllRoadmaps();
        return ResponseEntity.ok(Map.of("message", "Roadmap cleared"));
    }
}