package com.fasalsetu.backend.service;

import com.fasalsetu.backend.domain.model.Claim;
import com.fasalsetu.backend.repository.ClaimRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class ClaimService {

    @Autowired
    private ClaimRepository claimRepository;

    @Autowired
    private AiMockService aiMockService;

    public Claim fileClaim(Claim claim) {
        // 1. Save the claim initially with PROCESSING status
        claim.setStatus("PROCESSING");
        Claim saved = claimRepository.save(claim);

        // 2. Trigger AI assessment asynchronously (simulated inline for prototype)
        Map<String, Object> satelliteResult = aiMockService.assessSatelliteDamage(
            claim.getCalamityType(),
            null // GeoJSON boundary would come from Farm entity in M7 wiring
        );

        if (Boolean.TRUE.equals(satelliteResult.get("eligible"))) {
            Integer score = (Integer) satelliteResult.get("damageScore");
            saved.setAiDamageScore(score.doubleValue());
            saved.setStatus("AI_COMPLETE");
        } else {
            saved.setStatus("MANUAL_REVIEW");
        }

        return claimRepository.save(saved);
    }

    public List<Claim> getClaimsForFarmer(Long farmerId) {
        return claimRepository.findByFarmerId(farmerId);
    }
}
