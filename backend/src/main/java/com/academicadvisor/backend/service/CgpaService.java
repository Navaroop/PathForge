package com.academicadvisor.backend.service;

import com.academicadvisor.backend.entity.Cgparecord;
import com.academicadvisor.backend.entity.User;
import com.academicadvisor.backend.repository.CgpaRecordRepository;
import com.academicadvisor.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CgpaService {

    private final CgpaRecordRepository cgpaRepo;
    private final UserRepository userRepository;

    public User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private Map<String, Object> toMap(Cgparecord r) {
        Map<String, Object> m = new HashMap<>();
        m.put("id",           r.getId());
        m.put("semesterName", r.getSemesterName());
        m.put("gpa",          r.getGpa());
        m.put("cgpa",         r.getCgpa());
        m.put("subjectsJson", r.getSubjectsJson() != null ? r.getSubjectsJson() : "[]");
        return m;
    }

    public List<Map<String, Object>> getAllCgpa() {
        User user = getCurrentUser();
        return cgpaRepo.findByUserIdOrderByCreatedAtAsc(user.getId())
                .stream()
                .map(this::toMap)
                .collect(Collectors.toList());
    }

    public Map<String, Object> addCgpa(Map<String, Object> body) {
        User user = getCurrentUser();

        String semesterName = (String) body.get("semesterName");
        Double gpa          = Double.valueOf(body.get("gpa").toString());
        String subjectsJson = (String) body.getOrDefault("subjectsJson", "[]");

        if (cgpaRepo.existsByUserIdAndSemesterName(user.getId(), semesterName)) {
            throw new RuntimeException("Semester already exists. Delete it first to re-add.");
        }

        // Compute CGPA across all existing + new record
        List<Cgparecord> existing = cgpaRepo.findByUserIdOrderByCreatedAtAsc(user.getId());
        double totalGpa = existing.stream().mapToDouble(Cgparecord::getGpa).sum() + gpa;
        double cgpa     = Math.round((totalGpa / (existing.size() + 1)) * 100.0) / 100.0;

        Cgparecord record = Cgparecord.builder()
                .user(user)
                .semesterName(semesterName)
                .gpa(gpa)
                .cgpa(cgpa)
                .subjectsJson(subjectsJson)
                .build();

        Cgparecord saved = cgpaRepo.save(record);
        return toMap(saved);
    }

    public Map<String, Object> updateCgpa(Long id, Map<String, Object> body) {
        User user = getCurrentUser();

        Cgparecord record = cgpaRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Record not found"));

        if (!record.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }

        if (body.containsKey("gpa"))
            record.setGpa(Double.valueOf(body.get("gpa").toString()));
        if (body.containsKey("subjectsJson"))
            record.setSubjectsJson((String) body.get("subjectsJson"));

        // Recompute CGPA across all records after update
        cgpaRepo.save(record);
        List<Cgparecord> all = cgpaRepo.findByUserIdOrderByCreatedAtAsc(user.getId());
        double newCgpa = Math.round(
                all.stream().mapToDouble(Cgparecord::getGpa).average().orElse(0) * 100.0
        ) / 100.0;
        all.forEach(r -> r.setCgpa(newCgpa));
        cgpaRepo.saveAll(all);

        return toMap(record);
    }

    public void deleteCgpa(Long id) {
        User user = getCurrentUser();

        Cgparecord record = cgpaRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Record not found"));

        if (!record.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }

        cgpaRepo.delete(record);

        // Recompute CGPA for remaining records
        List<Cgparecord> remaining = cgpaRepo.findByUserIdOrderByCreatedAtAsc(user.getId());
        if (!remaining.isEmpty()) {
            double newCgpa = Math.round(
                    remaining.stream().mapToDouble(Cgparecord::getGpa).average().orElse(0) * 100.0
            ) / 100.0;
            remaining.forEach(r -> r.setCgpa(newCgpa));
            cgpaRepo.saveAll(remaining);
        }
    }
}
