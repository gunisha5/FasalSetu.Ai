package com.fasalsetu.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class RegistrationRequest {
    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Pattern(regexp = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$", message = "Invalid email")
    private String email;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\d{10}$", message = "Phone number must be 10 digits")
    private String phoneNumber;

    @NotBlank(message = "Password is required")
    @Pattern(regexp = "^(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$", message = "Password must be at least 8 characters and include one number and one special character")
    private String password;

    @NotBlank(message = "Aadhaar number is required")
    @Pattern(regexp = "^\\d{12}$", message = "Aadhaar number must be 12 digits")
    private String aadhaarNumber;

    @NotBlank(message = "State is required")
    private String state;

    @NotBlank(message = "District is required")
    private String district;

    @NotBlank(message = "Account holder name is required")
    private String accountHolderName;

    @NotBlank(message = "Bank name is required")
    private String bankName;

    @NotBlank(message = "Account number is required")
    @Pattern(regexp = "^\\d{9,18}$", message = "Account number must be 9-18 digits")
    private String accountNumber;

    @NotBlank(message = "IFSC code is required")
    @Pattern(regexp = "^[A-Z]{4}0[A-Z0-9]{6}$", message = "Invalid IFSC code")
    private String ifscCode;

    private String role = "FARMER";

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getAadhaarNumber() { return aadhaarNumber; }
    public void setAadhaarNumber(String aadhaarNumber) { this.aadhaarNumber = aadhaarNumber; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }
    public String getAccountHolderName() { return accountHolderName; }
    public void setAccountHolderName(String accountHolderName) { this.accountHolderName = accountHolderName; }
    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }
    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }
    public String getIfscCode() { return ifscCode; }
    public void setIfscCode(String ifscCode) { this.ifscCode = ifscCode; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
