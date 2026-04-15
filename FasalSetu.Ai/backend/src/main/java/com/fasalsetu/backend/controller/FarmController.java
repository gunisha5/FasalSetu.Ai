package com.fasalsetu.backend.controller;

import com.fasalsetu.backend.domain.model.Farm;
import com.fasalsetu.backend.service.FarmService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/farmer/farms")
public class FarmController {

    @Autowired
    private FarmService farmService;

    @GetMapping
    public ResponseEntity<List<Farm>> getAllFarms(@RequestParam Long farmerId) {
        // In M7, farmerId will be extracted from the JWT token in the request header
        return ResponseEntity.ok(farmService.getFarmsForFarmer(farmerId));
    }

    @PostMapping
    public ResponseEntity<Farm> addFarm(@RequestBody Farm farm) {
        return ResponseEntity.ok(farmService.addFarm(farm));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Farm> getFarmById(@PathVariable Long id) {
        return ResponseEntity.ok(farmService.getFarmById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Farm> updateFarm(@PathVariable Long id, @RequestBody Farm farm) {
        return ResponseEntity.ok(farmService.updateFarm(id, farm));
    }
}
