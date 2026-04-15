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
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Double getAiDamageScore() { return aiDamageScore; }
    public void setAiDamageScore(Double aiDamageScore) { this.aiDamageScore = aiDamageScore; }
}
