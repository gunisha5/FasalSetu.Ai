package com.fasalsetu.backend.service;

import com.fasalsetu.backend.domain.model.Claim;
import com.fasalsetu.backend.domain.model.Farm;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

@Service
public class AiIntegrationService {

    private static final Logger logger = LoggerFactory.getLogger(AiIntegrationService.class);
    private final RestTemplate restTemplate = new RestTemplate();
    private static final String AI_ENGINE_URL = "http://localhost:8001/predict";

    public static class DamageRequest {
        public double latitude;
        public double longitude;
        public String claim_date;
        public String district;
        public String crop;
        public String farmer_id;
        public String image_b64;
        public String lang;

        public DamageRequest(double latitude, double longitude, String claim_date, String district, String crop, String farmer_id, String image_b64, String lang) {
            this.latitude = latitude;
            this.longitude = longitude;
            this.claim_date = claim_date;
            this.district = district;
            this.crop = crop;
            this.farmer_id = farmer_id;
            this.image_b64 = image_b64;
            this.lang = lang;
        }
    }

    public static class DamageResponse {
        public String status;
        public double confidence;
        public String prediction;
        public String reasoning;
        public Map<String, Double> features;
        public Double estimated_claim;
    }

    public DamageResponse analyzeDamage(Farm farm, Claim claim, String lang) {
        try {
            // Extract representative coordinate from GeoJSON
            // For prototype: we look for [lng, lat] pattern in the string
            double[] coords = extractCoordinates(farm.getBoundaryGeoJson());
            
            DamageRequest request = new DamageRequest(
                coords[1], // latitude
                coords[0], // longitude
                claim.getDateOfLoss().toString(),
                farm.getDistrict(),
                farm.getPrimaryCrop(),
                claim.getFarmerId().toString(),
                null, // Placeholder: in a real flow, fetch first evidence b64 here
                lang
            );

            logger.info("Calling AI Engine at {} for Farm ID: {}", AI_ENGINE_URL, farm.getId());
            return restTemplate.postForObject(AI_ENGINE_URL, request, DamageResponse.class);
        } catch (Exception e) {
            logger.error("AI Engine call failed: {}", e.getMessage());
            return null;
        }
    }

    private double[] extractCoordinates(String geoJson) {
        // Fallback coordinates (Central India) if parsing fails
        double[] fallback = {78.9629, 20.5937};
        if (geoJson == null || geoJson.isEmpty()) return fallback;

        try {
            // Simple regex/substring to find the first pair of coordinates [[lng, lat]]
            // GeoJSON format: "coordinates": [[[lng, lat], ...]]
            int coordStart = geoJson.indexOf("[[[") + 3;
            if (coordStart < 3) coordStart = geoJson.indexOf("[") + 1;
            
            int coordEnd = geoJson.indexOf("]", coordStart);
            String pair = geoJson.substring(coordStart, coordEnd);
            String[] parts = pair.split(",");
            
            return new double[] {
                Double.parseDouble(parts[0].trim()),
                Double.parseDouble(parts[1].trim())
            };
        } catch (Exception e) {
            logger.warn("Failed to parse GeoJSON coordinates, using fallback: {}", e.getMessage());
            return fallback;
        }
    }
}
