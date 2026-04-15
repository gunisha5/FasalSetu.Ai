package com.fasalsetu.backend.repository;

import com.fasalsetu.backend.domain.model.BankDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BankDetailRepository extends JpaRepository<BankDetail, Long> {
    Optional<BankDetail> findByFarmerId(Long farmerId);
}
