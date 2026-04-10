package com.academicadvisor.backend.service;

import com.academicadvisor.backend.entity.AttendanceRecord;
import com.academicadvisor.backend.entity.AttendanceSchedule;
import com.academicadvisor.backend.entity.User;
import com.academicadvisor.backend.repository.AttendanceRecordRepository;
import com.academicadvisor.backend.repository.AttendanceScheduleRepository;
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
public class AttendanceService {

    private final AttendanceRecordRepository attendanceRepo;
    private final AttendanceScheduleRepository scheduleRepo;
    private final UserRepository userRepository;

    public User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private Map<String, Object> toMap(AttendanceRecord r) {
        Map<String, Object> m = new HashMap<>();
        m.put("id",                r.getId());
        m.put("subjectName",       r.getSubjectName());
        m.put("attendedClasses",   r.getAttendedClasses());
        m.put("totalClasses",      r.getTotalClasses());
        m.put("attendancePercent", r.getAttendancePercent());
        return m;
    }

    public List<Map<String, Object>> getAllAttendance() {
        User user = getCurrentUser();
        return attendanceRepo.findByUserId(user.getId())
                .stream()
                .map(this::toMap)
                .collect(Collectors.toList());
    }

    public Map<String, Object> addAttendance(Map<String, Object> body) {
        User user = getCurrentUser();

        String  subjectName     = (String) body.get("subjectName");
        Integer attendedClasses = Integer.valueOf(body.get("attendedClasses").toString());
        Integer totalClasses    = Integer.valueOf(body.get("totalClasses").toString());

        if (attendanceRepo.existsByUserIdAndSubjectName(user.getId(), subjectName)) {
            throw new RuntimeException("Subject already exists for this user.");
        }

        AttendanceRecord record = AttendanceRecord.builder()
                .user(user)
                .subjectName(subjectName)
                .attendedClasses(attendedClasses)
                .totalClasses(totalClasses)
                .build();

        AttendanceRecord saved = attendanceRepo.save(record);
        return toMap(saved);
    }

    public Map<String, Object> updateAttendance(Long id, Map<String, Object> body) {
        User user = getCurrentUser();

        AttendanceRecord record = attendanceRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Record not found"));

        if (!record.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }

        if (body.containsKey("attendedClasses"))
            record.setAttendedClasses(Integer.valueOf(body.get("attendedClasses").toString()));
        if (body.containsKey("totalClasses"))
            record.setTotalClasses(Integer.valueOf(body.get("totalClasses").toString()));
        if (body.containsKey("subjectName"))
            record.setSubjectName((String) body.get("subjectName"));

        AttendanceRecord saved = attendanceRepo.save(record);
        return toMap(saved);
    }

    public void deleteAttendance(Long id) {
        User user = getCurrentUser();

        AttendanceRecord record = attendanceRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Record not found"));

        if (!record.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }

        attendanceRepo.delete(record);
    }

    public Map<String, Integer> getSchedule() {
        User user = getCurrentUser();
        AttendanceSchedule schedule = scheduleRepo.findByUserId(user.getId()).orElse(null);
        if (schedule == null) {
            return Map.of("Mon", 0, "Tue", 0, "Wed", 0, "Thu", 0, "Fri", 0, "Sat", 0, "Sun", 0);
        }
        return Map.of(
            "Mon", schedule.getMon(),
            "Tue", schedule.getTue(),
            "Wed", schedule.getWed(),
            "Thu", schedule.getThu(),
            "Fri", schedule.getFri(),
            "Sat", schedule.getSat(),
            "Sun", schedule.getSun()
        );
    }

    public void updateSchedule(Map<String, Integer> body) {
        User user = getCurrentUser();
        AttendanceSchedule schedule = scheduleRepo.findByUserId(user.getId())
            .orElse(AttendanceSchedule.builder().user(user).build());

        schedule.setMon(body.getOrDefault("Mon", 0));
        schedule.setTue(body.getOrDefault("Tue", 0));
        schedule.setWed(body.getOrDefault("Wed", 0));
        schedule.setThu(body.getOrDefault("Thu", 0));
        schedule.setFri(body.getOrDefault("Fri", 0));
        schedule.setSat(body.getOrDefault("Sat", 0));
        schedule.setSun(body.getOrDefault("Sun", 0));

        scheduleRepo.save(schedule);
    }
}
