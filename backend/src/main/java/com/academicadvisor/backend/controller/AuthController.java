package com.academicadvisor.backend.controller;

import com.academicadvisor.backend.dto.AuthDto;
import com.academicadvisor.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

        private final AuthService authService;

        // Helper method to create cookie from token
        private ResponseCookie createJwtCookie(String token) {
                return ResponseCookie.from("jwt", token)
                                .httpOnly(true)
                                .secure(true) // Set to true in production if running HTTPS
                                .sameSite("None")
                                .path("/")
                                .maxAge(86400) // 1 day
                                .build();
        }

        // ── POST /api/auth/signup ─────────────────────────────────
        @PostMapping("/signup")
        public ResponseEntity<AuthDto.AuthResponse> signUp(
                        @RequestBody AuthDto.SignUpRequest request) {
                AuthDto.AuthResponse response = authService.signUp(request);
                return ResponseEntity.ok()
                                .header(HttpHeaders.SET_COOKIE, createJwtCookie(response.getToken()).toString())
                                .body(response);
        }

        // ── POST /api/auth/signin ─────────────────────────────────
        @PostMapping("/signin")
        public ResponseEntity<AuthDto.AuthResponse> signIn(
                        @RequestBody AuthDto.SignInRequest request) {
                AuthDto.AuthResponse response = authService.signIn(request);
                return ResponseEntity.ok()
                                .header(HttpHeaders.SET_COOKIE, createJwtCookie(response.getToken()).toString())
                                .body(response);
        }

        // ── POST /api/auth/logout ─────────────────────────────────
        @PostMapping("/logout")
        public ResponseEntity<?> logout() {
                ResponseCookie cookie = ResponseCookie.from("jwt", "")
                                .httpOnly(true)
                                .secure(false)
                                .path("/")
                                .maxAge(0) // Expire immediately
                                .build();
                return ResponseEntity.ok()
                                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                                .body(java.util.Map.of("message", "Logged out successfully"));
        }

        @GetMapping("/health")
        public ResponseEntity<String> health() {
                return ResponseEntity.ok("OK");
        }
}
