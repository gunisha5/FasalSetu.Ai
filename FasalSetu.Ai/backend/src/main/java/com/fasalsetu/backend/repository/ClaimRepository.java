package com.fasalsetu.backend.repository;

import com.fasalsetu.backend.domain.model.Claim;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Repository
public interface ClaimRepository extends JpaRepository<Claim, Long> {
    List<Claim> findByFarmerIdOrderByCreatedAtDesc(Long farmerId);
    List<Claim> findAllByOrderByCreatedAtDesc();

    @Modifying
    @Transactional
    @Query("UPDATE Claim c SET c.status = :status, c.agentRemark = :remark, c.updatedAt = :updatedAt WHERE c.id = :id")
    int updateStatusAndRemark(Long id, String status, String remark, LocalDateTime updatedAt);
}
