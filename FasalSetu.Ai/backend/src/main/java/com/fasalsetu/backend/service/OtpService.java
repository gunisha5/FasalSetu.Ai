package com.fasalsetu.backend.service;

import com.fasalsetu.backend.domain.model.EmailOtpToken;
import com.fasalsetu.backend.domain.model.OtpPurpose;
import com.fasalsetu.backend.repository.EmailOtpTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class OtpService {

    private final EmailOtpTokenRepository otpTokenRepository;
    private final PasswordEncoder passwordEncoder;
    
    // We will inject a Mail service later, for now we log
    // private final JavaMailSender javaMailSender;

    @Autowired
    public OtpService(EmailOtpTokenRepository otpTokenRepository, PasswordEncoder passwordEncoder) {
        this.otpTokenRepository = otpTokenRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Generates a 6-digit OTP, hashes it, stores it, and (for now) logs it.
     */
    @Transactional
    public String generateAndSendOtp(String email, OtpPurpose purpose) {
        // 1. Generate 6-digit OTP
        SecureRandom random = new SecureRandom();
        int otpValue = 100000 + random.nextInt(900000);
        String otp = String.valueOf(otpValue);

        // 2. Hash it
        String hashedOtp = passwordEncoder.encode(otp);

        // 3. Save to DB (invalidate any previous valid tokens for this user+purpose)
        Optional<EmailOtpToken> existingOtp = otpTokenRepository.findByEmailAndPurposeAndIsUsedFalseOrderByCreatedAtDesc(email, purpose);
        existingOtp.ifPresent(token -> {
            token.setUsed(true);
            otpTokenRepository.save(token);
        });

        EmailOtpToken newToken = new EmailOtpToken();
        newToken.setEmail(email);
        newToken.setOtpHash(hashedOtp);
        newToken.setPurpose(purpose);
        // Valid for 10 minutes
        newToken.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        
        otpTokenRepository.save(newToken);

        // 4. Send email (Mocked for now)
        sendMockEmail(email, otp, purpose);
        
        // Return OTP for testing purposes if needed (in prod, never return it in API response)
        // For security, true prod implementations only return a success message
        return otp;
    }

    /**
     * Verifies the OTP provided by the user.
     */
    @Transactional
    public boolean verifyOtp(String email, String otp, OtpPurpose purpose) {
        Optional<EmailOtpToken> tokenOpt = otpTokenRepository.findByEmailAndPurposeAndIsUsedFalseOrderByCreatedAtDesc(email, purpose);

        if (tokenOpt.isEmpty()) {
            return false;
        }

        EmailOtpToken token = tokenOpt.get();

        // Check expiration
        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            return false;
        }

        // Verify hash
        boolean isMatch = passwordEncoder.matches(otp, token.getOtpHash());

        if (isMatch) {
            token.setUsed(true);
            otpTokenRepository.save(token);
            return true;
        }

        return false;
    }

    private void sendMockEmail(String email, String otp, OtpPurpose purpose) {
        System.out.println("=========================================================");
        System.out.println("MOCK EMAIL SENT TO: " + email);
        System.out.println("PURPOSE: " + purpose);
        System.out.println("YOUR OTP IS: " + otp);
        System.out.println("=========================================================");
    }
}
