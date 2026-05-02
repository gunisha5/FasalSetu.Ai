package com.fasalsetu.backend.controller;

import com.fasalsetu.backend.domain.model.Claim;
import com.fasalsetu.backend.service.ClaimService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/farmer/claims")
public class ClaimController {

    @Autowired
    private ClaimService claimService;

    @GetMapping
    public ResponseEntity<List<Claim>> getClaims(@RequestParam Long farmerId) {
        return ResponseEntity.ok(claimService.getClaimsForFarmer(farmerId));
    }

    @PostMapping("/file")
    public ResponseEntity<Claim> fileClaim(@RequestBody Claim claim, @RequestHeader(value = "Accept-Language", defaultValue = "en") String lang) {
        return ResponseEntity.ok(claimService.fileClaim(claim, lang));
    }

    @PostMapping("/{id}/analyze")
    public ResponseEntity<Claim> analyzeClaim(@PathVariable Long id, @RequestParam(required = false) String date, @RequestHeader(value = "Accept-Language", defaultValue = "en") String lang) {
        Claim updated = claimService.analyzeClaim(id, date, lang);
        if (updated == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/ai-assess")
    public ResponseEntity<?> getAiAssessment(@RequestParam String calamityType) {
        // Convenience endpoint for frontend to check AI result mock directly
        return ResponseEntity.ok(Map.of(
            "calamityType", calamityType,
            "result", "damageScore: 74, severity: SEVERE, ndviDrop: 0.89"
        ));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteClaim(@PathVariable Long id, @RequestParam Long farmerId) {
        boolean deleted = claimService.deleteClaim(id, farmerId);
        if (deleted) return ResponseEntity.ok(Map.of("message", "Claim deleted successfully"));
        return ResponseEntity.badRequest().body(Map.of("error", "Unauthorized or claim not found"));
    }
}
