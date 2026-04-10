package com.academicadvisor.backend.repository;

import com.academicadvisor.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    // Used for signing in and token validation
    Optional<User> findByEmail(String email);

    // Used for signing up to check for duplicate accounts
    boolean existsByEmail(String email);
}