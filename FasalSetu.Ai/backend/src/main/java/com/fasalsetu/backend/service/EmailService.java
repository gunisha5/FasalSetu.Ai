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

    /**
     * Sends a claim status update notification to the farmer.
     */
    public void sendStatusUpdateEmail(String toEmail, Long claimId, String newStatus, String agentRemark) {
        System.out.println("[EmailService] Sending status update to: " + toEmail + " | Status: " + newStatus);
        try {
            String claimRef = "CLM-" + String.format("%06d", claimId);
            String statusLabel = switch (newStatus) {
                case "APPROVED"  -> "APPROVED ✅";
                case "REJECTED"  -> "REJECTED ❌";
                case "IN_REVIEW" -> "IN REVIEW 🔍";
                default          -> newStatus;
            };

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("FasalSetu Claim Status Update — " + claimRef);
            message.setText(
                "Dear Farmer,\n\n" +
                "Your crop insurance claim " + claimRef + " has been updated.\n\n" +
                "New Status: " + statusLabel + "\n\n" +
                (agentRemark != null && !agentRemark.isBlank()
                    ? "Agent Remarks: " + agentRemark + "\n\n"
                    : "") +
                "You can log in to FasalSetu.Ai to view your full claim report and timeline.\n\n" +
                "If you have questions, please reply to this email.\n\n" +
                "— FasalSetu.Ai Insurance Team"
            );
            mailSender.send(message);
            System.out.println("[EmailService] Status update email sent to: " + toEmail);
        } catch (Exception e) {
            System.err.println("[EmailService] Failed to send status update email: " + e.getMessage());
        }
    }
}
