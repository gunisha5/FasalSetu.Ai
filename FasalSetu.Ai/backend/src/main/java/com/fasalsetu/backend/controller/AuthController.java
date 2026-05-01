package com.fasalsetu.backend.controller;

import com.fasalsetu.backend.domain.model.OtpPurpose;
import com.fasalsetu.backend.service.OtpService;
import com.fasalsetu.backend.domain.model.User;
import com.fasalsetu.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final OtpService otpService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public AuthController(OtpService otpService, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.otpService = otpService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String purposeStr = request.get("purpose");

        if (email == null || purposeStr == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and purpose are required"));
        }

        try {
            OtpPurpose purpose = OtpPurpose.valueOf(purposeStr.toUpperCase());
            // In a real app we never return the actual OTP string in the response!
            // But we do it here (or just log it) for easier prototype debugging if needed.
            String otp = otpService.generateAndSendOtp(email, purpose);
            return ResponseEntity.ok(Map.of("message", "OTP sent to email", "mock_otp", otp));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid OTP purpose"));
        }
    }

    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String otp = request.get("otp");

        // Step 6: Fix DTO mapping / handle nulls
        if (email == null || otp == null) {
            return ResponseEntity.badRequest().body(Map.of("status", "FAILED", "message", "Email and otp are required"));
        }

        try {
            // Using the new logic that returns ResponseEntity
            return otpService.verifyOtp(email, otp);
        } catch (Exception e) {
            System.err.println("Verification Error: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("status", "FAILED", "message", "Verification failed"));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");
        
        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and password are required"));
        }

        // Hardcoded Agent Bypass for Prototype
        if ("agent@fasalsetu.com".equals(email) && "agent123".equals(password)) {
            return ResponseEntity.ok(Map.of(
                "message", "Agent login successful", 
                "token", "agent-jwt-token",
                "user", Map.of(
                    "id", 999,
                    "fullName", "FasalSetu Agent",
                    "email", "agent@fasalsetu.com",
                    "role", "AGENT",
                    "isEmailVerified", true
                )
            ));
        }
        
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid email or password"));
        }

        User user = userOpt.get();
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid email or password"));
        }

        return ResponseEntity.ok(Map.of(
            "message", "Login successful", 
            "token", "mock-jwt-token",
            "user", Map.of(
                "id", user.getId(),
                "fullName", user.getFullName(),
                "email", user.getEmail(),
                "role", user.getRole(),
                "isEmailVerified", user.isEmailVerified()
            )
        ));
    }
}
