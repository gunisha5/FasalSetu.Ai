package com.fasalsetu.backend.repository;

import com.fasalsetu.backend.domain.model.Claim;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClaimRepository extends JpaRepository<Claim, Long> {
    List<Claim> findByFarmerId(Long farmerId);
}
