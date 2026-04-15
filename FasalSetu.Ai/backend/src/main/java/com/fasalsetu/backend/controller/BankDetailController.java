package com.fasalsetu.backend.controller;

import com.fasalsetu.backend.domain.model.BankDetail;
import com.fasalsetu.backend.repository.BankDetailRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/farmer/bank-details")
public class BankDetailController {

    @Autowired
    private BankDetailRepository bankDetailRepository;

    @GetMapping
    public ResponseEntity<BankDetail> getBankDetails(@RequestParam Long farmerId) {
        Optional<BankDetail> details = bankDetailRepository.findByFarmerId(farmerId);
        return details.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<BankDetail> updateBankDetails(@RequestBody BankDetail bankDetail) {
        return ResponseEntity.ok(bankDetailRepository.save(bankDetail));
    }
}
