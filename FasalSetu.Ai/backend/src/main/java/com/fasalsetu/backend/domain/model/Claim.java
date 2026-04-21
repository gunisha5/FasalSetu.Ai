package com.fasalsetu.backend.domain.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "claims")
public class Claim {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "farmer_id", nullable = false)
    private Long farmerId;

    @Column(name = "farm_id", nullable = false)
    private Long farmId;

    @Column(name = "calamity_type", nullable = false)
    private String calamityType;

    @Column(name = "date_of_loss")
    private LocalDate dateOfLoss;

    @Column(name = "status", nullable = false)
    private String status = "PROCESSING";

    // Computed via Satellite AI
    @Column(name = "ai_damage_score")
    private Double aiDamageScore;

    @Column(name = "ai_confidence")
    private Double aiConfidence;

    @Column(name = "ai_reasoning", columnDefinition = "TEXT")
    private String aiReasoning;

    @Column(name = "delta_ndvi")
    private Double deltaNdvi;

    @Column(name = "delta_ndwi")
    private Double deltaNdwi;

    @Column(name = "delta_sar")
    private Double deltaSar;

    @Column(name = "flood_probability")
    private Double floodProbability;

    @Column(name = "drought_probability")
    private Double droughtProbability;

    @Column(name = "visual_flood_score")
    private Double visualFloodScore;

    @Column(name = "visual_drought_score")
    private Double visualDroughtScore;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Claim() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getFarmerId() { return farmerId; }
    public void setFarmerId(Long farmerId) { this.farmerId = farmerId; }
    public Long getFarmId() { return farmId; }
    public void setFarmId(Long farmId) { this.farmId = farmId; }
    public String getCalamityType() { return calamityType; }
    public void setCalamityType(String calamityType) { this.calamityType = calamityType; }
    public LocalDate getDateOfLoss() { return dateOfLoss; }
    public void setDateOfLoss(LocalDate dateOfLoss) { this.dateOfLoss = dateOfLoss; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Double getAiDamageScore() { return aiDamageScore; }
    public void setAiDamageScore(Double aiDamageScore) { this.aiDamageScore = aiDamageScore; }
    public Double getAiConfidence() { return aiConfidence; }
    public void setAiConfidence(Double aiConfidence) { this.aiConfidence = aiConfidence; }
    public String getAiReasoning() { return aiReasoning; }
    public void setAiReasoning(String aiReasoning) { this.aiReasoning = aiReasoning; }
    public Double getDeltaNdvi() { return deltaNdvi; }
    public void setDeltaNdvi(Double deltaNdvi) { this.deltaNdvi = deltaNdvi; }
    public Double getDeltaNdwi() { return deltaNdwi; }
    public void setDeltaNdwi(Double deltaNdwi) { this.deltaNdwi = deltaNdwi; }
    public Double getDeltaSar() { return deltaSar; }
    public void setDeltaSar(Double deltaSar) { this.deltaSar = deltaSar; }
    public Double getFloodProbability() { return floodProbability; }
    public void setFloodProbability(Double floodProbability) { this.floodProbability = floodProbability; }
    public Double getDroughtProbability() { return droughtProbability; }
    public void setDroughtProbability(Double droughtProbability) { this.droughtProbability = droughtProbability; }
    public Double getVisualFloodScore() { return visualFloodScore; }
    public void setVisualFloodScore(Double visualFloodScore) { this.visualFloodScore = visualFloodScore; }
    public Double getVisualDroughtScore() { return visualDroughtScore; }
    public void setVisualDroughtScore(Double visualDroughtScore) { this.visualDroughtScore = visualDroughtScore; }
}
