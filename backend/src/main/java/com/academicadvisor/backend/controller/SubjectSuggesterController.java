package com.academicadvisor.backend.controller;

import com.academicadvisor.backend.entity.SuggesterHistory;
import com.academicadvisor.backend.entity.SuggesterSaved;
import com.academicadvisor.backend.service.SubjectSuggesterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/suggester")
@RequiredArgsConstructor
public class SubjectSuggesterController {

    private final SubjectSuggesterService suggesterService;

    // ── History endpoints ──

    @GetMapping("/history")
    public ResponseEntity<List<SuggesterHistory>> getHistory() {
        return ResponseEntity.ok(suggesterService.getHistory());
    }

    @PostMapping("/history")
    public ResponseEntity<?> saveHistory(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(suggesterService.saveHistory(body));
    }

    @DeleteMapping("/history")
    public ResponseEntity<?> clearHistory() {
        suggesterService.clearHistory();
        return ResponseEntity.ok(Map.of("message", "History cleared"));
    }

    @DeleteMapping("/history/{id}")
    public ResponseEntity<?> deleteHistory(@PathVariable Long id) {
        try {
            suggesterService.deleteHistory(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            if ("Access denied".equals(e.getMessage())) {
                return ResponseEntity.status(403).body(Map.of("message", e.getMessage()));
            }
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ── Saved endpoints ──

    @GetMapping("/saved")
    public ResponseEntity<List<SuggesterSaved>> getSaved() {
        return ResponseEntity.ok(suggesterService.getSaved());
    }

    @PostMapping("/saved")
    public ResponseEntity<?> addSaved(@RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(suggesterService.addSaved(body));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/saved")
    public ResponseEntity<?> clearSaved() {
        suggesterService.clearSaved();
        return ResponseEntity.ok(Map.of("message", "Saved subjects cleared"));
    }

    @DeleteMapping("/saved/{id}")
    public ResponseEntity<?> deleteSaved(@PathVariable Long id) {
        try {
            suggesterService.deleteSaved(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            if ("Access denied".equals(e.getMessage())) {
                return ResponseEntity.status(403).body(Map.of("message", e.getMessage()));
            }
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
