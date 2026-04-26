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

    @Column(name = "sum_insured_per_acre")
    private Double sumInsuredPerAcre;

    @Column(name = "total_sum_insured")
    private Double totalSumInsured;

    @Column(name = "farm_area_snapshot")
    private Double farmAreaSnapshot;

    @Column(name = "rainfall_mm")
    private Double rainfallMm;

    @Column(name = "rainfall_7d")
    private Double rainfall7d;

    @Column(name = "temp_avg")
    private Double tempAvg;

    @Column(name = "flood_risk")
    private Double floodRisk;

    @Column(name = "drought_risk")
    private Double droughtRisk;

    @Column(name = "estimated_payout")
    private Double estimatedPayout;

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

    public Double getSumInsuredPerAcre() { return sumInsuredPerAcre; }
    public void setSumInsuredPerAcre(Double sumInsuredPerAcre) { this.sumInsuredPerAcre = sumInsuredPerAcre; }

    public Double getTotalSumInsured() { return totalSumInsured; }
    public void setTotalSumInsured(Double totalSumInsured) { this.totalSumInsured = totalSumInsured; }

    public Double getFarmAreaSnapshot() { return farmAreaSnapshot; }
    public void setFarmAreaSnapshot(Double farmAreaSnapshot) { this.farmAreaSnapshot = farmAreaSnapshot; }

    public Double getRainfallMm() { return rainfallMm; }
    public void setRainfallMm(Double rainfallMm) { this.rainfallMm = rainfallMm; }

    public Double getRainfall7d() { return rainfall7d; }
    public void setRainfall7d(Double rainfall7d) { this.rainfall7d = rainfall7d; }

    public Double getTempAvg() { return tempAvg; }
    public void setTempAvg(Double tempAvg) { this.tempAvg = tempAvg; }

    public Double getFloodRisk() { return floodRisk; }
    public void setFloodRisk(Double floodRisk) { this.floodRisk = floodRisk; }

    public Double getDroughtRisk() { return droughtRisk; }
    public void setDroughtRisk(Double droughtRisk) { this.droughtRisk = droughtRisk; }

    public Double getEstimatedPayout() { return estimatedPayout; }
    public void setEstimatedPayout(Double estimatedPayout) { this.estimatedPayout = estimatedPayout; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
