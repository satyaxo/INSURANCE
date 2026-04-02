package com.edutech.insurance_claims_processing_system.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.edutech.insurance_claims_processing_system.entity.Claim;
import com.edutech.insurance_claims_processing_system.entity.Investigator;
import com.edutech.insurance_claims_processing_system.entity.Underwriter;
import com.edutech.insurance_claims_processing_system.repository.InvestigatorRepository;
import com.edutech.insurance_claims_processing_system.repository.UnderwriterRepository;
import com.edutech.insurance_claims_processing_system.service.ClaimService;

import java.util.List;

@RestController
@RequestMapping("/api/adjuster")
@CrossOrigin
public class AdjusterController {

     @Autowired
    private ClaimService claimService;

    @Autowired
    private UnderwriterRepository underwriterRepository;

    @Autowired
    private InvestigatorRepository investigatorRepository;

    // ✅ Get all claims
    @GetMapping("/claims")
    public List<Claim> getAllClaims() {
        return claimService.getAllClaims();
    }

    // ✅ Update claim (Adjuster workflow)
    @PutMapping("/claim/{id}")
    public ResponseEntity<Claim> updateClaim(
            @PathVariable Long id,
            @RequestBody Claim claimDetails) {

        if (id == null || claimDetails == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid request");
        }

        return ResponseEntity.ok(claimService.updateClaim(id, claimDetails));
    }

    // ✅ Get all underwriters
    @GetMapping("/underwriters")
    public List<Underwriter> getAllUnderwriters() {
        return underwriterRepository.findAll();
    }

    // ✅ NEW: Get all investigators (THIS FIXES dropdown error)
    @GetMapping("/investigators")
    public List<Investigator> getAllInvestigators() {
        return investigatorRepository.findAll();
    }

    // ✅ Assign claim to underwriter
    @PutMapping("/claim/{claimId}/assign")
    public ResponseEntity<Claim> assignClaimToUnderwriter(
            @PathVariable Long claimId,
            @RequestParam Long underwriterId) {

        if (claimId == null || underwriterId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid request");
        }

        return ResponseEntity.ok(
                claimService.assignClaimToUnderwriter(claimId, underwriterId)
        );
    }


    // ✅ Assign claim to investigator
@PutMapping("/claim/{claimId}/assign-investigator")
public ResponseEntity<Claim> assignClaimToInvestigator(
        @PathVariable Long claimId,
        @RequestParam Long investigatorId) {

    if (claimId == null || investigatorId == null) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid request");
    }

    return ResponseEntity.ok(
            claimService.assignClaimToInvestigator(claimId, investigatorId)
    );
}





}