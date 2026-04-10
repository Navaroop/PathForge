package com.academicadvisor.backend.repository;

import com.academicadvisor.backend.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, Long> {

    // Filter subjects by department
    List<Subject> findByDepartment(String department);

    // Filter subjects by semester
    List<Subject> findBySemester(Integer semester);

    // Filter subjects by domain
    List<Subject> findByDomain(String domain);

    // Filter subjects by difficulty level
    List<Subject> findByDifficulty(String difficulty);

    // Filter by department and semester combined
    List<Subject> findByDepartmentAndSemester(String department, Integer semester);

    // Filter by domain and difficulty combined
    List<Subject> findByDomainAndDifficulty(String domain, String difficulty);
}
