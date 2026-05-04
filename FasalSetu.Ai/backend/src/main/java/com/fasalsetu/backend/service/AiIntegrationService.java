package com.fasalsetu.backend.service;

import com.fasalsetu.backend.domain.model.Claim;
import com.fasalsetu.backend.domain.model.Farm;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;

@Service
public class AiIntegrationService {

    private static final Logger logger = LoggerFactory.getLogger(AiIntegrationService.class);
    private final RestTemplate restTemplate = new RestTemplate();
    
    @Value("${AI_ENGINE_URL:http://localhost:8001/predict}")
    private String aiEngineUrl;


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
        public String explanation; // Matches AI engine field
        public Double damage_percent;
        public String warning;
        public Map<String, Double> features;
        public Double estimated_claim;
    }

    public DamageResponse analyzeDamage(Farm farm, Claim claim, String lang) {
        try {
            double[] coords = extractCoordinates(farm.getBoundaryGeoJson());
            
            // Step C & D: Send as multipart/form-data
            org.springframework.util.MultiValueMap<String, Object> body = new org.springframework.util.LinkedMultiValueMap<>();
            body.add("latitude", coords[1]);
            body.add("longitude", coords[0]);
            body.add("claim_date", claim.getDateOfLoss().toString());
            body.add("district", farm.getDistrict());
            body.add("crop", farm.getPrimaryCrop() != null ? farm.getPrimaryCrop() : "wheat");
            body.add("farmer_id", claim.getFarmerId().toString());
            body.add("lang", lang);
            
            // Step E: Add debug logs
            System.out.println("[AI CALL URL] " + aiEngineUrl);
            logger.info("Calling AI Engine at {} for Farm ID: {}", aiEngineUrl, farm.getId());

            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.MULTIPART_FORM_DATA);

            org.springframework.http.HttpEntity<org.springframework.util.MultiValueMap<String, Object>> requestEntity = 
                new org.springframework.http.HttpEntity<>(body, headers);

            return restTemplate.postForObject(aiEngineUrl, requestEntity, DamageResponse.class);
        } catch (Exception e) {
            // Step F: Handle failure safely
            logger.error("AI Engine call failed: {}", e.getMessage());
            DamageResponse errorRes = new DamageResponse();
            errorRes.status = "FAILED";
            errorRes.explanation = "AI engine unavailable";
            return errorRes;
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
