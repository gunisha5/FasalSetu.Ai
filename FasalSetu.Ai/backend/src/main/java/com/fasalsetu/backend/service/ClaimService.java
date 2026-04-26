package com.fasalsetu.backend.service;

import com.fasalsetu.backend.domain.model.Claim;
import com.fasalsetu.backend.domain.model.Farm;
import com.fasalsetu.backend.repository.ClaimRepository;
import com.fasalsetu.backend.repository.FarmRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ClaimService {

    @Autowired
    private ClaimRepository claimRepository;

    @Autowired
    private FarmRepository farmRepository;

    @Autowired
    private AiIntegrationService aiIntegrationService;

    public Claim fileClaim(Claim claim, String lang) {
        // Just call the central analyze method
        claim.setStatus("PROCESSING");
        return analyzeClaim(claimRepository.save(claim), lang);
    }

    public Claim analyzeClaim(Long claimId, String dateOverride, String lang) {
        Optional<Claim> claimOpt = claimRepository.findById(claimId);
        if (claimOpt.isEmpty()) return null;
        
        Claim claim = claimOpt.get();
        if (dateOverride != null && !dateOverride.isEmpty()) {
            claim.setDateOfLoss(java.time.LocalDate.parse(dateOverride));
        }
        
        return analyzeClaim(claim, lang);
    }

    private Claim analyzeClaim(Claim saved, String lang) {
        // Fetch Farm details for location coordinates
        Optional<Farm> farmOpt = farmRepository.findById(saved.getFarmId());
        
        if (farmOpt.isPresent()) {
            Farm farm = farmOpt.get();
            
            // Call Real AI Integration Service
            AiIntegrationService.DamageResponse aiResponse = aiIntegrationService.analyzeDamage(farm, saved, lang);
            
            if (aiResponse != null) {
                // Update with detailed AI results
                saved.setStatus("AI_COMPLETE");
                saved.setAiConfidence(aiResponse.confidence);
                saved.setAiReasoning(aiResponse.reasoning);
                
                if (aiResponse.features != null) {
                    Map<String, Double> f = aiResponse.features;
                    saved.setDeltaNdvi(f.get("delta_ndvi"));
                    saved.setDeltaSar(f.get("delta_sar"));
                    saved.setRainfallMm(f.get("rainfall_current"));
                    saved.setRainfall7d(f.get("rainfall_7d"));
                    saved.setTempAvg(f.get("temp_avg"));
                    saved.setFloodRisk(f.get("flood_risk"));
                    saved.setDroughtRisk(f.get("drought_risk"));
                }
                
                // Map status to application status
                if (aiResponse.confidence > 0.6) {
                    saved.setAiDamageScore(aiResponse.confidence * 100.0);
                } else {
                    saved.setAiDamageScore(0.0);
                    saved.setStatus("MANUAL_REVIEW");
                }
                
                // Calculate Payout using Policy-Aware Logic
                saved.setEstimatedPayout(calculateEstimatedPayout(saved));
            } else {
                saved.setStatus("AI_ERROR");
                saved.setAiReasoning("AI Engine was unreachable or returned an error.");
            }
        } else {
            saved.setStatus("ERROR");
            saved.setAiReasoning("Associated farm record not found.");
        }

        return claimRepository.save(saved);
    }

    /**
     * Policy-Aware Payout Calculation
     * Formula: min( (TotalSumInsured * Damage% * Coverage%) * Confidence, MaxCap )
     */
    private double calculateEstimatedPayout(Claim claim) {
        double damageScore = claim.getAiDamageScore() != null ? claim.getAiDamageScore() : 0.0;
        double confidence = claim.getAiConfidence() != null ? claim.getAiConfidence() : 1.0;
        
        // Policy Constants (Normally fetched from Insurance Policy Service)
        double coverageFactor = 0.90;      // 90% coverage
        double maxClaimCap = 500000.0;    // Maximum ₹ 5 Lakhs per claim

        double sumInsured = claim.getSumInsuredPerAcre() != null ? claim.getSumInsuredPerAcre() : 25000.0;
        double area = claim.getFarmAreaSnapshot() != null ? claim.getFarmAreaSnapshot() : 1.0;
        double totalSumInsured = sumInsured * area;

        // Core Calculation
        double rawDamageValue = totalSumInsured * (damageScore / 100.0);
        double adjustedPayout = rawDamageValue * coverageFactor * confidence;

        // Apply Policy Cap
        double finalPayout = Math.min(adjustedPayout, maxClaimCap);

        return Math.round(finalPayout * 100.0) / 100.0;
    }

    public List<Claim> getClaimsForFarmer(Long farmerId) {
        return claimRepository.findByFarmerId(farmerId);
    }
}
