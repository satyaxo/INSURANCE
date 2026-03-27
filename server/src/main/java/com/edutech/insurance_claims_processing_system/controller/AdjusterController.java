package com.edutech.insurance_claims_processing_system.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.edutech.insurance_claims_processing_system.entity.Claim;
import com.edutech.insurance_claims_processing_system.entity.Underwriter;
import com.edutech.insurance_claims_processing_system.repository.UnderwriterRepository;
import com.edutech.insurance_claims_processing_system.service.ClaimService;

import java.util.List;

@RestController
@RequestMapping("/api/adjuster")
public class AdjusterController {

    @Autowired
    private UnderwriterRepository underwriterRepository;

    @Autowired
    private ClaimService claimService;

    /**
     * Updates a claim based on its ID.
     */
    @PutMapping("/claim/{id}")
    public ResponseEntity<Claim> updateClaim(
            @PathVariable Long id,
            @RequestBody Claim claimDetails) {

        Claim updatedClaim = claimService.updateClaim(id, claimDetails);
        return ResponseEntity.ok(updatedClaim);
    }

    /**
     * Retrieves all claims.
     */
    @GetMapping("/claims")
    public List<Claim> getAllClaims() {
        return claimService.getAllClaims();
    }

    /**
     * Retrieves all underwriters.
     */
    @GetMapping("/underwriters")
    public List<Underwriter> getAllUnderwriters() {
        return underwriterRepository.findAll();
    }

    /**
     * Assigns a claim to an underwriter.
     */
    @PutMapping("/claim/{claimId}/assign")
    public ResponseEntity<Claim> assignClaimToUnderwriter(
            @PathVariable Long claimId,
            @RequestParam Long underwriterId) {

        Claim assignedClaim = claimService.assignClaimToUnderwriter(claimId, underwriterId);

        return ResponseEntity.ok(assignedClaim);
    }

    // implement required code here

}
