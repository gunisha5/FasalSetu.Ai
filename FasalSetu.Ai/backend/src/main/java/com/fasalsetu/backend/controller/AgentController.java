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
     * POST approve a claim — agent confirms the AI recommendation.
     */
    @PostMapping("/claims/{id}/approve")
    public ResponseEntity<?> approveClaim(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {

        return claimRepository.findById(id).map(claim -> {
            claim.setStatus("APPROVED");
            claimRepository.save(claim);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Claim " + claim.getId() + " approved.",
                "agentNotes", body.getOrDefault("agentNotes", "")
            ));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * POST reject a claim with mandatory agent notes.
     */
    @PostMapping("/claims/{id}/reject")
    public ResponseEntity<?> rejectClaim(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {

        return claimRepository.findById(id).map(claim -> {
            claim.setStatus("REJECTED");
            claimRepository.save(claim);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Claim " + claim.getId() + " rejected.",
                "agentNotes", body.getOrDefault("agentNotes", "")
            ));
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
