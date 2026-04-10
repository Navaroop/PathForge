package com.academicadvisor.backend.repository;

import com.academicadvisor.backend.entity.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {

    // Get all attendance records for a specific user
    List<AttendanceRecord> findByUserId(Long userId);

    // Delete all attendance records for a user
    void deleteByUserId(Long userId);

    // Check if a subject already exists for a user
    boolean existsByUserIdAndSubjectName(Long userId, String subjectName);
}
