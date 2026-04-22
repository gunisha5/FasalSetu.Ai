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
    private final EmailService emailService;

    @Autowired
    public OtpService(EmailOtpTokenRepository otpTokenRepository, 
                      PasswordEncoder passwordEncoder,
                      EmailService emailService) {
        this.otpTokenRepository = otpTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    /**
     * Generates a 6-digit OTP, hashes it, stores it, and sends it via EmailService.
     */
    @Transactional
    public String generateAndSendOtp(String email, OtpPurpose purpose) {
        // 1. Generate 6-digit OTP
        SecureRandom random = new SecureRandom();
        int otpValue = 100000 + random.nextInt(900000);
        String otp = String.valueOf(otpValue);

        // 2. Hash it for secure storage
        String hashedOtp = passwordEncoder.encode(otp);

        // 3. Mark any previous valid tokens for this user+purpose as used/invalid
        Optional<EmailOtpToken> existingOtp = otpTokenRepository.findByEmailAndPurposeAndIsUsedFalseOrderByCreatedAtDesc(email, purpose);
        existingOtp.ifPresent(token -> {
            token.setUsed(true);
            otpTokenRepository.save(token);
        });

        // 4. Save new verification token to DB
        EmailOtpToken newToken = new EmailOtpToken();
        newToken.setEmail(email);
        newToken.setOtpHash(hashedOtp);
        newToken.setPurpose(purpose);
        // Valid for 10 minutes
        newToken.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        
        otpTokenRepository.save(newToken);

        // 5. Dispatch real email via SMTP
        emailService.sendOtpEmail(email, otp);
        
        // Note: In a final production build, we might returned void or a boolean
        // For now, we return it so the caller can handle any immediate dev-testing needs
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

        // Verify hash matches
        boolean isMatch = passwordEncoder.matches(otp, token.getOtpHash());

        if (isMatch) {
            token.setUsed(true);
            otpTokenRepository.save(token);
            return true;
        }

        return false;
    }
}
