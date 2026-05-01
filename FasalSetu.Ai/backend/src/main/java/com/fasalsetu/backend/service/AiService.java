package com.fasalsetu.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.Map;

@Service
public class AiService {
    private final RestTemplate restTemplate = new RestTemplate();
    private final String AI_URL = "http://localhost:8001/predict";


    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(AiService.class);

    public Map<String, Object> getAiPrediction(Map<String, Object> request) {
        logger.info(">>> AI REQUEST | Farmer: {} | Loc: [{}, {}] | Date: {}", 
            request.get("farmer_id"), request.get("latitude"), request.get("longitude"), request.get("claim_date"));

        try {
            Map<String, Object> response = restTemplate.postForObject(AI_URL, request, Map.class);
            
            if (response != null && "SUCCESS".equals(response.get("status"))) {
                Map<String, Object> features = (Map<String, Object>) response.get("features");
                logger.info("<<< AI SUCCESS | Pred: {} | Conf: {} | NDVI: {} | SAR: {} | Rain: {}mm",
                    response.get("prediction"), response.get("confidence"),
                    features.get("delta_ndvi"), features.get("delta_sar"), features.get("rainfall"));
            } else {
                logger.warn("<<< AI FAILED | Msg: {}", response != null ? response.get("message") : "Empty");
            }
            return response;
        } catch (Exception e) {
            logger.error("<<< AI ERROR | Msg: {}", e.getMessage());
            return Map.of("status", "ERROR", "message", "AI Engine unreachable");
        }
    }
}
