package com.fasalsetu.backend.controller;

import com.fasalsetu.backend.domain.model.Claim;
import com.fasalsetu.backend.domain.model.User;
import com.fasalsetu.backend.repository.ClaimRepository;
import com.fasalsetu.backend.repository.FarmRepository;
import com.fasalsetu.backend.repository.UserRepository;
import com.fasalsetu.backend.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/agent")
public class AgentController {

    @Autowired private ClaimRepository claimRepository;
    @Autowired private UserRepository  userRepository;
    @Autowired private FarmRepository  farmRepository;
    @Autowired private EmailService    emailService;

    /**
     * GET /api/agent/claims
     * Returns all claims enriched with farmer name, district, crop.
     */
    @GetMapping("/claims")
    public ResponseEntity<List<Map<String, Object>>> getAllClaims() {
        List<Claim> claims = claimRepository.findAllByOrderByCreatedAtDesc();
        List<Map<String, Object>> enriched = claims.stream().map(c -> {
            Map<String, Object> m = new LinkedHashMap<>();

            // ── Core claim fields ──────────────────────────────────────────────
            m.put("claimId",          c.getId());
            m.put("status",           c.getStatus());
            m.put("calamityType",     c.getCalamityType());
            m.put("dateOfLoss",       c.getDateOfLoss());
            m.put("farmerId",         c.getFarmerId());
            m.put("farmId",           c.getFarmId());

            // ── AI result fields (needed by PDF generator) ─────────────────────
            m.put("prediction",        c.getPrediction() != null ? c.getPrediction() : c.getCalamityType());
            m.put("ai_damage_score",   c.getAiDamageScore());
            m.put("damage_percent",    c.getAiDamageScore());
            m.put("aiConfidence",      c.getAiConfidence());
            m.put("confidence",        c.getAiConfidence());
            m.put("aiReasoning",       c.getAiReasoning());
            m.put("estimated_payout",  c.getEstimatedPayout());
            m.put("estimated_claim",   c.getEstimatedPayout());
            m.put("rainfallMm",        c.getRainfallMm());
            m.put("rainfall7d",        c.getRainfall7d());
            m.put("floodRisk",         c.getFloodRisk());
            m.put("droughtRisk",       c.getDroughtRisk());
            m.put("agentRemark",       c.getAgentRemark());

            // ── Policy fields ─────────────────────────────────────────────────
            m.put("sumInsuredPerAcre", c.getSumInsuredPerAcre());
            m.put("totalSumInsured",   c.getTotalSumInsured());
            m.put("farmAreaSnapshot",  c.getFarmAreaSnapshot());
            m.put("estimatedPayout",   c.getEstimatedPayout());

            // Rebuild policy_summary object for PDF
            double sumIns = c.getTotalSumInsured() != null ? c.getTotalSumInsured() : 0.0;
            double covUsed = c.getSumInsuredPerAcre() != null && sumIns > 0
                    ? (c.getEstimatedPayout() != null ? c.getEstimatedPayout() / sumIns : 0.0)
                    : 0.0;
            Map<String, Object> policyMap = new LinkedHashMap<>();
            policyMap.put("sum_insured",   sumIns);
            policyMap.put("coverage_used", Math.min(covUsed, 1.0));
            m.put("policy_summary", policyMap);

            m.put("reportUrl", "http://localhost:8001/download-report/" + c.getId());

            // ── Farmer info ───────────────────────────────────────────────────
            if (c.getFarmerId() != null) {
                userRepository.findById(c.getFarmerId()).ifPresentOrElse(u -> {
                    m.put("farmerName",  u.getFullName());
                    m.put("farmerEmail", u.getEmail());
                }, () -> {
                    m.put("farmerName",  "Unknown");
                    m.put("farmerEmail", "");
                });
            } else {
                m.put("farmerName",  "Unknown");
                m.put("farmerEmail", "");
            }

            // ── Farm info ─────────────────────────────────────────────────────
            if (c.getFarmId() != null) {
                farmRepository.findById(c.getFarmId()).ifPresentOrElse(f -> {
                    m.put("farmName",  f.getFarmName());
                    m.put("district",  f.getDistrict());
                    m.put("village",   f.getVillage());
                    m.put("cropType",  f.getPrimaryCrop());
                    m.put("latitude",  null);
                    m.put("longitude", null);
                    m.put("areaAcres", f.getAreaAcres());
                }, () -> {
                    m.put("farmName",  "Unknown");
                    m.put("district",  "Unknown");
                    m.put("village",   "Unknown");
                    m.put("cropType",  "N/A");
                    m.put("latitude",  null);
                    m.put("longitude", null);
                    m.put("areaAcres", null);
                });
            } else {
                m.put("farmName",  "Unknown");
                m.put("district",  "Unknown");
                m.put("village",   "Unknown");
                m.put("cropType",  "N/A");
                m.put("latitude",  null);
                m.put("longitude", null);
                m.put("areaAcres", null);
            }
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(enriched);
    }

    /**
     * GET /api/agent/claims/{id}
     * Full claim detail with farmer + farm info.
     */
    @GetMapping("/claims/{id}")
    public ResponseEntity<?> getClaimById(@PathVariable Long id) {
        return claimRepository.findById(id).map(c -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",             c.getId());
            m.put("farmerId",       c.getFarmerId());
            m.put("farmId",         c.getFarmId());
            m.put("calamityType",   c.getCalamityType());
            m.put("dateOfLoss",     c.getDateOfLoss());
            m.put("status",         c.getStatus());
            m.put("aiConfidence",   c.getAiConfidence());
            m.put("aiDamageScore",  c.getAiDamageScore());
            m.put("aiReasoning",    c.getAiReasoning());
            m.put("droughtRisk",    c.getDroughtRisk());
            m.put("floodRisk",      c.getFloodRisk());
            m.put("rainfallMm",     c.getRainfallMm());
            m.put("rainfall7d",     c.getRainfall7d());
            m.put("estimatedPayout",c.getEstimatedPayout());
            m.put("totalSumInsured",c.getTotalSumInsured());
            m.put("sumInsuredPerAcre", c.getSumInsuredPerAcre());
            m.put("farmAreaSnapshot",  c.getFarmAreaSnapshot());
            m.put("agentRemark",    c.getAgentRemark());
            m.put("createdAt",      c.getCreatedAt());
            m.put("updatedAt",      c.getUpdatedAt());

            if (c.getFarmerId() != null) {
                userRepository.findById(c.getFarmerId()).ifPresent(u -> {
                    m.put("farmerName",  u.getFullName());
                    m.put("farmerEmail", u.getEmail());
                    m.put("farmerPhone", u.getPhoneNumber());
                });
            }
            if (c.getFarmId() != null) {
                farmRepository.findById(c.getFarmId()).ifPresent(f -> {
                    m.put("district",   f.getDistrict());
                    m.put("village",    f.getVillage());
                    m.put("crop",       f.getPrimaryCrop());
                    m.put("farmName",   f.getFarmName());
                    m.put("areaAcres",  f.getAreaAcres());
                    m.put("state",      f.getState());
                });
            }
            return ResponseEntity.ok(m);
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * PUT /api/agent/claims/{id}/status
     * Updates claim status, saves agent remark, sends email to farmer.
     */
    @PutMapping("/claims/{id}/status")
    public ResponseEntity<?> updateClaimStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        String newStatus  = body.getOrDefault("status", "");
        String agentNotes = body.getOrDefault("remark", body.getOrDefault("agentNotes", ""));

        Set<String> valid = Set.of("PENDING", "IN_REVIEW", "APPROVED", "REJECTED", "MANUAL_REVIEW");
        if (!valid.contains(newStatus)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Invalid status: " + newStatus));
        }

        return claimRepository.findById(id).map(claim -> {
            String timelineEntry = "Agent marked claim as " + newStatus + " with remark: " + agentNotes;
            String finalRemark = claim.getAgentRemark() == null || claim.getAgentRemark().isBlank()
                    ? timelineEntry
                    : claim.getAgentRemark() + "\n" + timelineEntry;

            // ONLY update status and agent_remark using custom JPQL query to ensure AI fields are not overwritten
            claimRepository.updateStatusAndRemark(id, newStatus, finalRemark, LocalDateTime.now());

            // Send email notification to farmer
            if (claim.getFarmerId() != null) {
                userRepository.findById(claim.getFarmerId()).ifPresent(farmer ->
                    emailService.sendStatusUpdateEmail(
                        farmer.getEmail(), claim.getId(), newStatus, agentNotes
                    )
                );
            }

            return ResponseEntity.ok(Map.of(
                "message", "Status updated to " + newStatus,
                "claimId", id,
                "status",  newStatus
            ));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/farmers")
    public ResponseEntity<List<Map<String, Object>>> getFarmers() {
        List<User> farmers = userRepository.findByRole("FARMER");
        
        List<Map<String, Object>> response = farmers.stream().map(farmer -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("name", farmer.getFullName());
            map.put("email", farmer.getEmail());
            
            List<com.fasalsetu.backend.domain.model.Farm> farms = farmRepository.findByFarmerId(farmer.getId());
            List<Map<String, String>> farmList = farms.stream().map(f -> {
                Map<String, String> fMap = new LinkedHashMap<>();
                fMap.put("farmName", f.getFarmName());
                fMap.put("district", f.getDistrict());
                fMap.put("village", f.getVillage());
                return fMap;
            }).collect(Collectors.toList());
            
            map.put("farms", farmList);
            return map;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        List<Claim> all = claimRepository.findAll();
        long totalClaims    = all.size();
        long approvedClaims = all.stream().filter(c -> "APPROVED".equals(c.getStatus())).count();
        long rejectedClaims = all.stream().filter(c -> "REJECTED".equals(c.getStatus())).count();
        double totalPayout  = all.stream()
            .filter(c -> "APPROVED".equals(c.getStatus()) && c.getEstimatedPayout() != null)
            .mapToDouble(Claim::getEstimatedPayout).sum();

        return ResponseEntity.ok(Map.of(
            "totalClaims",    totalClaims,
            "approvedClaims", approvedClaims,
            "rejectedClaims", rejectedClaims,
            "totalPayout",    totalPayout
        ));
    }
}
