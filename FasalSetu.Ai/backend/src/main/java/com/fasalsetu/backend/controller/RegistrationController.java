package com.fasalsetu.backend.controller;

import com.fasalsetu.backend.domain.model.User;
import com.fasalsetu.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class RegistrationController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Self-registration endpoint used by the 3-step Registration Wizard.
     * Creates or updates the user record from the wizard's final step.
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String fullName = payload.get("fullName");
        String password = payload.get("password");
        String role = payload.getOrDefault("role", "FARMER");

        if (email == null || password == null || fullName == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email, password, and full name are required."));
        }

        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email already registered."));
        }

        User user = new User();
        user.setEmail(email);
        user.setFullName(fullName);
        user.setRole(role);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setEmailVerified(true); // Since they verified OTP before reaching here
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
            "message", "Registration successful. You can now log in.",
            "email", email
        ));
    }
}
