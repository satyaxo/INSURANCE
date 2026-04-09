package com.edutech.insurance_claims_processing_system.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.edutech.insurance_claims_processing_system.entity.Claim;
import com.edutech.insurance_claims_processing_system.dto.PolicyholderClaimTrackingDTO;
import com.edutech.insurance_claims_processing_system.service.ClaimService;

import java.util.List;

@RestController
@RequestMapping("/api/policyholder")
@CrossOrigin(origins = "*")
public class PolicyholderController {

    @Autowired
    private ClaimService claimService;

    /**
     * Submits a new claim for a policyholder.
     */
    @PostMapping("/claim")
    public ResponseEntity<Claim> submitClaim(
            @RequestParam Long policyholderId,
            @RequestBody Claim claim) {

        Claim submittedClaim = claimService.submitClaim(policyholderId, claim);
        return ResponseEntity.ok(submittedClaim);
    }

    /**
     * Retrieves all claims submitted by a specific policyholder.
     */
    @GetMapping("/claims")
    public ResponseEntity<List<Claim>> getClaims(
            @RequestParam Long policyholderId) {

        List<Claim> claims = claimService.getClaimsByPolicyholder(policyholderId);
        return ResponseEntity.ok(claims);
    }

    /**
     * ✅ NEW: Tracking dashboard endpoint for policyholder
     * Shows claim status + stage + investigation status (if available)
     */
    @GetMapping("/claims/tracking")
    public ResponseEntity<List<PolicyholderClaimTrackingDTO>> getClaimsTracking(
            @RequestParam Long policyholderId) {

        List<PolicyholderClaimTrackingDTO> tracking =
                claimService.getPolicyholderClaimsTracking(policyholderId);

        return ResponseEntity.ok(tracking);
    }
}