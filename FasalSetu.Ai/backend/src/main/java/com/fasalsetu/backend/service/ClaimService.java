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
                // Use damage_percent from AI engine (NOT confidence-based)
                saved.setAiDamageScore(aiResponse.damage_percent != null ? aiResponse.damage_percent : 0.0);
                saved.setAiConfidence(aiResponse.confidence);
                saved.setAiReasoning(aiResponse.explanation);
                
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
                
                // Set application status based on confidence
                if (aiResponse.confidence < 0.5) {
                    saved.setStatus("MANUAL_REVIEW");
                    if (aiResponse.warning != null) {
                        saved.setAiReasoning(aiResponse.explanation + " [WARNING: " + aiResponse.warning + "]");
                    }
                } else {
                    saved.setStatus("AI_COMPLETE");
                }
                
                // Use the claim value directly from AI engine
                saved.setEstimatedPayout(aiResponse.estimated_claim != null ? aiResponse.estimated_claim : 0.0);
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
     * @deprecated Use estimated_claim from AI engine instead.
     * Duplicate logic removed to prevent incorrect claim values.
     */
    private double calculateEstimatedPayout(Claim claim) {
        return 0.0;
    }

    public List<Claim> getClaimsForFarmer(Long farmerId) {
        return claimRepository.findByFarmerId(farmerId);
    }
}
