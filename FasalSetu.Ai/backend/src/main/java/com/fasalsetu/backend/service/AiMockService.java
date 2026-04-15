package com.fasalsetu.backend.service;

import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * AI Mock Service — Phase M6 Prototype
 *
 * This service simulates the two AI engines described in the plan:
 *   Engine 1: Sentinel-2 Satellite Imagery Analysis (FLOOD / DROUGHT only)
 *   Engine 2: Policy OCR + NLP payout calculator
 *
 * In production (Phase M8+), each method will delegate to a Python FastAPI
 * microservice via RestTemplate. The response contract (field names, types)
 * is intentionally identical so the switch is a one-line change.
 */
@Service
public class AiMockService {

    /**
     * Simulates satellite damage assessment.
     * @param calamityType e.g. "Flood", "Drought"
     * @param farmBoundaryGeoJson GeoJSON polygon string of the farm boundary
     * @return Map containing damageScore (0-100), severity label, ndviDrop
     */
    public Map<String, Object> assessSatelliteDamage(String calamityType, String farmBoundaryGeoJson) {
        boolean isAiAssisted = "Flood".equalsIgnoreCase(calamityType) || "Drought".equalsIgnoreCase(calamityType);

        if (!isAiAssisted) {
            // No satellite analysis for Pest, Hailstorm etc.
            return Map.of(
                "eligible", false,
                "reason", "Satellite analysis not available for calamity type: " + calamityType
            );
        }

        // --- PROTOTYPE MOCK ---
        // PRODUCTION: Replace with:
        //   SatelliteResult result = restTemplate.postForObject(
        //       "http://ai-service:8000/flood-drought-assess",
        //       new SatelliteRequest(farmBoundaryGeoJson, calamityType),
        //       SatelliteResult.class);
        return Map.of(
            "eligible", true,
            "damageScore", 74,
            "severity", "SEVERE",
            "ndviDrop", 0.89,
            "cloudCoverPercent", 5,
            "analysisDate", "2025-08-16"
        );
    }

    /**
     * Simulates policy OCR + NLP payout calculator.
     * @param policyDocumentUrl URL of the uploaded policy PDF (Cloudinary link)
     * @param damageScore The satellite damage score (0-100)
     * @return Map containing covered, entitledPayout, formulaExplanation
     */
    public Map<String, Object> analyzePolicy(String policyDocumentUrl, int damageScore) {
        // --- PROTOTYPE MOCK ---
        // PRODUCTION: Replace with Google Vision API + NLP microservice call
        double baseCoverage = 200000.0;
        double payout = baseCoverage * (damageScore / 100.0);

        return Map.of(
            "covered", true,
            "entitledPayout", Math.round(payout),
            "coverageType", "FLOOD",
            "formulaExplanation", "Base Coverage ₹" + (long) baseCoverage +
                                  " × Damage Score " + damageScore +
                                  "% = ₹" + Math.round(payout),
            "exclusions", java.util.List.of()
        );
    }
}
