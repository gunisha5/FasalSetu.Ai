package com.fasalsetu.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendOtpEmail(String toEmail, String otpCode) {
        // ─── DEV MODE: Always log the OTP so you can test without real Gmail ─────
        System.out.println("==============================================");
        System.out.println("  OTP for " + toEmail + "  →  " + otpCode);
        System.out.println("==============================================");

        // ─── Skip real email if credentials are still placeholder ──────────────
        if (fromEmail == null
                || fromEmail.isBlank()
                || fromEmail.equals("your-email@gmail.com")) {
            System.out.println("[EmailService] Skipping SMTP — placeholder credentials detected.");
            System.out.println("[EmailService] To enable real emails, update application.properties:");
            System.out.println("  spring.mail.username=your-real@gmail.com");
            System.out.println("  spring.mail.password=your-16-char-app-password");
            return;
        }

        // ─── Real Gmail SMTP dispatch ──────────────────────────────────────────
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("FasalSetu.Ai — Your Login OTP");
            message.setText(
                "Welcome to FasalSetu.Ai!\n\n" +
                "Your verification code is: " + otpCode + "\n\n" +
                "This code expires in 10 minutes. Do not share it with anyone.\n\n" +
                "— FasalSetu.Ai Team"
            );
            mailSender.send(message);
            System.out.println("[EmailService] OTP email sent successfully to: " + toEmail);
        } catch (Exception e) {
            System.err.println("[EmailService] SMTP send failed: " + e.getMessage());
            // OTP is already saved in DB — user can still verify if they read logs
        }
    }
}
