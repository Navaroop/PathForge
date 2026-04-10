package com.academicadvisor.backend.repository;

import com.academicadvisor.backend.entity.Careerroadmap;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CareerRoadmapRepository extends JpaRepository<Careerroadmap, Long> {

    List<Careerroadmap> findByUserId(Long userId);

}