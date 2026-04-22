package com.fasalsetu.backend.controller;

import com.fasalsetu.backend.domain.model.BankDetail;
import com.fasalsetu.backend.domain.model.User;
import com.fasalsetu.backend.dto.RegistrationRequest;
import com.fasalsetu.backend.repository.BankDetailRepository;
import com.fasalsetu.backend.repository.UserRepository;
import jakarta.validation.Valid;
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

    @Autowired
    private BankDetailRepository bankDetailRepository;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegistrationRequest payload) {
        if (userRepository.findByEmail(payload.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email already registered."));
        }
        if (userRepository.findByPhoneNumber(payload.getPhoneNumber()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Phone number already registered."));
        }
        if (userRepository.findByAadhaarNumber(payload.getAadhaarNumber()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Aadhaar number already registered."));
        }

        User user = new User();
        user.setEmail(payload.getEmail());
        user.setFullName(payload.getFullName());
        user.setPhoneNumber(payload.getPhoneNumber());
        user.setAadhaarNumber(payload.getAadhaarNumber());
        user.setState(payload.getState());
        user.setDistrict(payload.getDistrict());
        user.setRole(payload.getRole() == null || payload.getRole().isBlank() ? "FARMER" : payload.getRole());
        user.setPasswordHash(passwordEncoder.encode(payload.getPassword()));
        user.setEmailVerified(true);
        User savedUser = userRepository.save(user);

        BankDetail bankDetail = new BankDetail();
        bankDetail.setFarmerId(savedUser.getId());
        bankDetail.setAccountHolder(payload.getAccountHolderName());
        bankDetail.setBankName(payload.getBankName());
        bankDetail.setAccountNumber(payload.getAccountNumber());
        bankDetail.setIfscCode(payload.getIfscCode().toUpperCase());
        bankDetailRepository.save(bankDetail);

        return ResponseEntity.ok(Map.of(
            "message", "Registration successful. You can now log in.",
            "email", savedUser.getEmail(),
            "userId", savedUser.getId()
        ));
    }
}
