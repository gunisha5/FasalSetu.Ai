package com.fasalsetu.backend.controller;

import com.fasalsetu.backend.domain.model.Claim;
import com.fasalsetu.backend.repository.ClaimRepository;
import com.fasalsetu.backend.service.AiMockService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/agent")
public class AgentController {

    @Autowired
    private ClaimRepository claimRepository;

    @Autowired
    private AiMockService aiMockService;

    /**
     * GET all claims — sorted by status for the agent queue.
     */
    @GetMapping("/claims")
    public ResponseEntity<List<Claim>> getAllClaims() {
        return ResponseEntity.ok(claimRepository.findAll());
    }

    /**
     * GET claim by ID with full details.
     */
    @GetMapping("/claims/{id}")
    public ResponseEntity<Claim> getClaimById(@PathVariable Long id) {
        return claimRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * PUT update claim status.
     */
    @PutMapping("/claims/{id}/status")
    public ResponseEntity<?> updateClaimStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        return claimRepository.findById(id).map(claim -> {
            claim.setStatus(status);
            claimRepository.save(claim);
            return ResponseEntity.ok(Map.of("message", "Status updated to " + status));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET AI assessment for a given calamity type + geoJSON boundary.
     * Called by the Agent Review screen to display the satellite computation.
     */
    @GetMapping("/claims/{id}/ai-report")
    public ResponseEntity<?> getAiReport(@PathVariable Long id) {
        return claimRepository.findById(id).map(claim -> {
            Map<String, Object> result = aiMockService.assessSatelliteDamage(
                claim.getCalamityType(), null
            );
            return ResponseEntity.ok(result);
        }).orElse(ResponseEntity.notFound().build());
    }
}
