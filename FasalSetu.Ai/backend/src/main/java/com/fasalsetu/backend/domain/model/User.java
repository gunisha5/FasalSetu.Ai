package com.fasalsetu.backend.domain.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String fullName;

    @Column(name = "phone_number", unique = true)
    private String phoneNumber;

    @Column(name = "aadhaar_number", unique = true)
    private String aadhaarNumber;

    @Column(name = "state_name")
    private String state;

    @Column(name = "district_name")
    private String district;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    // e.g., "FARMER" or "AGENT"
    @Column(nullable = false)
    private String role; 

    @Column(name = "is_email_verified")
    private Boolean isEmailVerified = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public User() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getAadhaarNumber() { return aadhaarNumber; }
    public void setAadhaarNumber(String aadhaarNumber) { this.aadhaarNumber = aadhaarNumber; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }
    
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    
    public boolean isEmailVerified() { return isEmailVerified != null ? isEmailVerified : false; }
    public void setEmailVerified(Boolean emailVerified) { isEmailVerified = emailVerified; }
}
