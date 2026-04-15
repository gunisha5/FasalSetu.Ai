package com.fasalsetu.backend.repository;

import com.fasalsetu.backend.domain.model.EmailOtpToken;
import com.fasalsetu.backend.domain.model.OtpPurpose;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmailOtpTokenRepository extends JpaRepository<EmailOtpToken, Long> {
    Optional<EmailOtpToken> findByEmailAndPurposeAndIsUsedFalseOrderByCreatedAtDesc(String email, OtpPurpose purpose);
}
