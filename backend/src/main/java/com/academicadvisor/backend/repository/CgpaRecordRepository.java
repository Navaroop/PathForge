package com.academicadvisor.backend.repository;

import com.academicadvisor.backend.entity.Cgparecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CgpaRecordRepository extends JpaRepository<Cgparecord, Long> {

    List<Cgparecord> findByUserIdOrderByCreatedAtAsc(Long userId);

    boolean existsByUserIdAndSemesterName(Long userId, String semesterName);

    void deleteByUserId(Long userId);
}