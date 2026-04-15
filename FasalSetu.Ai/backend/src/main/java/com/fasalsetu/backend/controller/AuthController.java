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
        String purposeStr = request.get("purpose");

        if (email == null || otp == null || purposeStr == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email, otp, and purpose are required"));
        }

        try {
            OtpPurpose purpose = OtpPurpose.valueOf(purposeStr.toUpperCase());
            boolean isVerified = otpService.verifyOtp(email, otp, purpose);
            
            if (isVerified) {
                return ResponseEntity.ok(Map.of("message", "OTP verified successfully"));
                // Here we would typically generate a JWT and return it for LOGIN/REGISTER.
            } else {
                return ResponseEntity.status(401).body(Map.of("message", "Invalid or expired OTP"));
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid OTP purpose"));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");
        
        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and password are required"));
        }
        
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid email or password"));
        }

        User user = userOpt.get();
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid email or password"));
        }

        // Return real user data (A real implementation would return a solid JWT)
        return ResponseEntity.ok(Map.of(
            "message", "Login successful", 
            "token", "mock-jwt-token-for-dev-only",
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
