package com.fasalsetu.backend.service;

import com.fasalsetu.backend.domain.model.Claim;
import com.fasalsetu.backend.domain.model.Farm;
import com.fasalsetu.backend.repository.ClaimRepository;
import com.fasalsetu.backend.repository.FarmRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ClaimService {

    @Autowired
    private ClaimRepository claimRepository;

    @Autowired
    private FarmRepository farmRepository;

    @Autowired
    private AiIntegrationService aiIntegrationService;

    public Claim fileClaim(Claim claim) {
        // 1. Save the claim initially with PROCESSING status
        claim.setStatus("PROCESSING");
        Claim saved = claimRepository.save(claim);

        // 2. Fetch Farm details for location coordinates
        Optional<Farm> farmOpt = farmRepository.findById(claim.getFarmId());
        
        if (farmOpt.isPresent()) {
            Farm farm = farmOpt.get();
            
            // 3. Call Real AI Integration Service
            AiIntegrationService.DamageResponse aiResponse = aiIntegrationService.analyzeDamage(farm, saved);
            
            if (aiResponse != null) {
                // Update with detailed AI results
                saved.setStatus("AI_COMPLETE");
                saved.setAiConfidence(aiResponse.confidence);
                saved.setAiReasoning(aiResponse.reasoning);
                saved.setDeltaNdvi(aiResponse.delta_ndvi);
                saved.setDeltaNdwi(aiResponse.delta_ndwi);
                saved.setDeltaSar(aiResponse.delta_sar);
                saved.setFloodProbability(aiResponse.flood_probability);
                saved.setDroughtProbability(aiResponse.drought_probability);
                saved.setVisualFloodScore(aiResponse.visual_flood_score);
                saved.setVisualDroughtScore(aiResponse.visual_drought_score);
                
                // Map status to application status
                if ("APPROVED_FLOOD".equals(aiResponse.status) || "APPROVED_DROUGHT".equals(aiResponse.status)) {
                    saved.setAiDamageScore(aiResponse.confidence * 100);
                } else {
                    saved.setAiDamageScore(0.0);
                    if ("INCONCLUSIVE".equals(aiResponse.status)) {
                        saved.setStatus("MANUAL_REVIEW");
                    }
                }
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

    public List<Claim> getClaimsForFarmer(Long farmerId) {
        return claimRepository.findByFarmerId(farmerId);
    }
}
