
package com.academicadvisor.backend.controller;

import com.academicadvisor.backend.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    // ── GET /api/attendance ───────────────────────────────────
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAll() {
        return ResponseEntity.ok(attendanceService.getAllAttendance());
    }

    // ── POST /api/attendance ──────────────────────────────────
    @PostMapping
    public ResponseEntity<?> add(@RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(attendanceService.addAttendance(body));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ── PUT /api/attendance/{id} ──────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(attendanceService.updateAttendance(id, body));
        } catch (RuntimeException e) {
            if (e.getMessage().equals("Access denied")) {
                return ResponseEntity.status(403).body(Map.of("message", e.getMessage()));
            }
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ── DELETE /api/attendance/{id} ───────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            attendanceService.deleteAttendance(id);
            return ResponseEntity.ok(Map.of("message", "Deleted successfully"));
        } catch (RuntimeException e) {
            if (e.getMessage().equals("Access denied")) {
                return ResponseEntity.status(403).body(Map.of("message", e.getMessage()));
            }
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ── GET /api/attendance/schedule ──────────────────────────
    @GetMapping("/schedule")
    public ResponseEntity<?> getSchedule() {
        return ResponseEntity.ok(attendanceService.getSchedule());
    }

    // ── PUT /api/attendance/schedule ──────────────────────────
    @PutMapping("/schedule")
    public ResponseEntity<?> updateSchedule(@RequestBody Map<String, Integer> body) {
        attendanceService.updateSchedule(body);
        return ResponseEntity.ok(Map.of("message", "Schedule updated"));
    }
}