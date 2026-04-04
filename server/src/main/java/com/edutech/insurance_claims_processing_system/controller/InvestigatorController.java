package com.edutech.insurance_claims_processing_system.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.edutech.insurance_claims_processing_system.entity.Claim;
import com.edutech.insurance_claims_processing_system.entity.Investigation;
import com.edutech.insurance_claims_processing_system.service.ClaimService;
import com.edutech.insurance_claims_processing_system.service.InvestigationService;

import java.util.List;

@RestController
@RequestMapping("/api/investigator")
@CrossOrigin
public class InvestigatorController {

    @Autowired
    private InvestigationService investigationService;

    // ✅ FIX: Properly injected
    @Autowired
    private ClaimService claimService;

    @PostMapping("/investigation")
    public ResponseEntity<Investigation> createInvestigation(
            @RequestBody Investigation investigation) {

        if (investigation == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid request");
        }

        return ResponseEntity.ok(investigationService.createInvestigation(investigation));
    }

    @PutMapping("/investigation/{id}")
    public ResponseEntity<Investigation> updateInvestigation(
            @PathVariable Long id,
            @RequestBody Investigation investigationDetails) {

        return ResponseEntity.ok(
                investigationService.updateInvestigation(id, investigationDetails));
    }

    @GetMapping("/investigations")
    public List<Investigation> getAllInvestigations() {
        return investigationService.getAllInvestigations();
    }

    // ✅ FIX: Investigator receives assigned claims
    @GetMapping("/claims")
    public List<Claim> getAssignedClaims(@RequestParam Long investigatorId) {
        return claimService.getClaimsByInvestigator(investigatorId);
    }
}







