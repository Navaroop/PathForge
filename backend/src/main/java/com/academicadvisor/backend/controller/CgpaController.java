package com.academicadvisor.backend.controller;

import com.academicadvisor.backend.service.CgpaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cgpa")
@RequiredArgsConstructor
public class CgpaController {

    private final CgpaService cgpaService;

    // ── GET /api/cgpa ─────────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAll() {
        return ResponseEntity.ok(cgpaService.getAllCgpa());
    }

    // ── POST /api/cgpa ────────────────────────────────────────
    @PostMapping
    public ResponseEntity<?> add(@RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(cgpaService.addCgpa(body));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ── PUT /api/cgpa/{id} ────────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(cgpaService.updateCgpa(id, body));
        } catch (RuntimeException e) {
            if ("Access denied".equals(e.getMessage())) {
                return ResponseEntity.status(403).body(Map.of("message", e.getMessage()));
            }
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ── DELETE /api/cgpa/{id} ─────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            cgpaService.deleteCgpa(id);
            return ResponseEntity.ok(Map.of("message", "Deleted successfully"));
        } catch (RuntimeException e) {
            if ("Access denied".equals(e.getMessage())) {
                return ResponseEntity.status(403).body(Map.of("message", e.getMessage()));
            }
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}