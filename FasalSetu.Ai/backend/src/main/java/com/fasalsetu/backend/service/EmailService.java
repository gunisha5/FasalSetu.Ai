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

    /**
     * Sends a standard OTP email to the user.
     */
    public void sendOtpEmail(String toEmail, String otpCode) {
        System.out.println("[EmailService] Attempting to send OTP to: " + toEmail);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("FasalSetu.Ai — Your Login OTP");
            message.setText(
                "Welcome to FasalSetu.Ai!\n\n" +
                "Your verification code is: " + otpCode + "\n\n" +
                "This code expires in 10 minutes. Do not share it with anyone.\n\n" +
                "If you did not request this, please ignore this email.\n\n" +
                "— FasalSetu.Ai Team"
            );
            
            mailSender.send(message);
            System.out.println("[EmailService] OTP email sent successfully to: " + toEmail);
        } catch (Exception e) {
            System.err.println("[EmailService] FAILED to send email to: " + toEmail);
            System.err.println("[EmailService] Reason: " + e.getMessage());
            System.err.println("[EmailService] CHECK: application.properties for correct gmail/app-password.");
            
            // Still log to console for dev visibility
            System.out.println("==============================================");
            System.out.println("  DEV FALLBACK: OTP for " + toEmail + " is → " + otpCode);
            System.out.println("==============================================");
        }
    }
}
