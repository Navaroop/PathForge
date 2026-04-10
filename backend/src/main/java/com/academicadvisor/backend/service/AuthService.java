package com.academicadvisor.backend.service;

import com.academicadvisor.backend.dto.AuthDto;
import com.academicadvisor.backend.entity.User;
import com.academicadvisor.backend.repository.UserRepository;
import com.academicadvisor.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository    userRepository;
    private final PasswordEncoder   passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authManager;

    // ── Register a new user ───────────────────────────────────
    public AuthDto.AuthResponse signUp(AuthDto.SignUpRequest request) {

        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        // Build user entity — password is hashed with BCrypt
        User user = User.builder()
            .fullName(request.getFullName())
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .department(request.getDepartment())
            .currentSemester(request.getCurrentSemester())
            .build();

        // Save to database
        userRepository.save(user);

        // Generate JWT token
        String token = jwtService.generateToken(user);

        return AuthDto.AuthResponse.builder()
            .token(token)
            .fullName(user.getFullName())
            .email(user.getEmail())
            .department(user.getDepartment())
            .currentSemester(user.getCurrentSemester())
            .build();
    }

    // ── Authenticate existing user ────────────────────────────
    public AuthDto.AuthResponse signIn(AuthDto.SignInRequest request) {

        // Spring Security validates email + password
        authManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                request.getEmail(),
                request.getPassword()
            )
        );

        // Fetch user from database
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new RuntimeException("User not found"));

        // Generate JWT token
        String token = jwtService.generateToken(user);

        return AuthDto.AuthResponse.builder()
            .token(token)
            .fullName(user.getFullName())
            .email(user.getEmail())
            .department(user.getDepartment())
            .currentSemester(user.getCurrentSemester())
            .build();
    }
}
