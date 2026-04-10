package com.academicadvisor.backend.repository;

import com.academicadvisor.backend.entity.AttendanceSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AttendanceScheduleRepository extends JpaRepository<AttendanceSchedule, Long> {
    Optional<AttendanceSchedule> findByUserId(Long userId);
}
