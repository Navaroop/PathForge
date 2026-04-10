package com.academicadvisor.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// ── Sign Up Request ───────────────────────────────────────
// Data the user sends when registering
public class AuthDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SignUpRequest {
        private String fullName;
        private String email;
        private String password;
        private String department;
        private Integer currentSemester;
    }

    // ── Sign In Request ───────────────────────────────────────
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SignInRequest {
        private String email;
        private String password;
    }

    // ── Auth Response ─────────────────────────────────────────
    // What we send back after successful login or registration
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuthResponse {
        private String token;
        private String fullName;
        private String email;
        private String department;
        private Integer currentSemester;
    }
}
