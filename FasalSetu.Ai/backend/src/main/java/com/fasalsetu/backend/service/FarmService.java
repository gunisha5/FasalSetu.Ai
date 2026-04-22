package com.fasalsetu.backend.service;

import com.fasalsetu.backend.domain.model.Farm;
import com.fasalsetu.backend.repository.FarmRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FarmService {

    @Autowired
    private FarmRepository farmRepository;

    public List<Farm> getFarmsForFarmer(Long farmerId) {
        return farmRepository.findByFarmerId(farmerId);
    }

    public Farm addFarm(Farm farm) {
        return farmRepository.save(farm);
    }

    public Farm getFarmById(Long farmId) {
        return farmRepository.findById(farmId)
                .orElseThrow(() -> new RuntimeException("Farm not found: " + farmId));
    }

    public Farm updateFarm(Long id, Farm updatedFarm) {
        Farm existing = getFarmById(id);
        existing.setFarmName(updatedFarm.getFarmName());
        existing.setState(updatedFarm.getState());
        existing.setDistrict(updatedFarm.getDistrict());
        existing.setVillage(updatedFarm.getVillage());
        existing.setPrimaryCrop(updatedFarm.getPrimaryCrop());
        existing.setAreaAcres(updatedFarm.getAreaAcres());
        existing.setSoilType(updatedFarm.getSoilType());
        existing.setIrrigationType(updatedFarm.getIrrigationType());
        existing.setTaluka(updatedFarm.getTaluka());
        existing.setPincode(updatedFarm.getPincode());
        existing.setSurveyNumber(updatedFarm.getSurveyNumber());
        return farmRepository.save(existing);
    }
}
