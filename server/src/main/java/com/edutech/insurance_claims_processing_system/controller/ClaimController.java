package com.edutech.insurance_claims_processing_system.controller;

import com.edutech.insurance_claims_processing_system.dto.UnderwriterClaimDTO;
import com.edutech.insurance_claims_processing_system.entity.Claim;
import com.edutech.insurance_claims_processing_system.service.ClaimService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/claims")
@CrossOrigin(origins = "*")
public class ClaimController {

    @Autowired
    private ClaimService claimService;

    // ✅ Get all claims (optional)
    @GetMapping
    public List<Claim> getAllClaims() {
        return claimService.getAllClaims();
    }

    // ✅ Get claims for Underwriter (ENTITY list - old usage)
    @GetMapping("/underwriter/{id}")
    public List<Claim> getClaimsByUnderwriter(@PathVariable Long id) {
        return claimService.getClaimsForReview(id);
    }

    // ✅ Get claims for Underwriter (DTO list with report + policy fields) - best for workbench UI
    // Use this if your HttpService is calling /api/claims/underwriter-dto/{id}
    @GetMapping("/underwriter-dto/{id}")
    public List<UnderwriterClaimDTO> getClaimsByUnderwriterDTO(@PathVariable Long id) {
        return claimService.getUnderwriterClaimsWithReport(id);
    }

    // ✅ Update claim status (Approve / Reject)
    @PutMapping("/{id}/status")
    public Claim updateStatus(@PathVariable Long id, @RequestBody Claim updatedClaim) {
        if (updatedClaim == null || updatedClaim.getStatus() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status is required");
        }
        return claimService.updateClaim(id, updatedClaim);
    }

    /* =========================================================
       ✅ ADJUSTER ENDPOINTS
       ========================================================= */

    // ✅ Adjuster sees all SUBMITTED claims that are not assigned yet
    @GetMapping("/unassigned")
    public List<Claim> getUnassignedClaims() {
        return claimService.getUnassignedSubmittedClaims();
    }

    // ✅ Adjuster sees claims assigned to them
    @GetMapping("/adjuster/{adjusterId}")
    public List<Claim> getClaimsByAdjuster(@PathVariable Long adjusterId) {
        return claimService.getClaimsByAdjuster(adjusterId);
    }

    // ✅ Adjuster assigns a claim to themselves
    @PutMapping("/{claimId}/assign-adjuster/{adjusterId}")
    public Claim assignClaimToAdjuster(@PathVariable Long claimId, @PathVariable Long adjusterId) {
        return claimService.assignClaimToAdjuster(claimId, adjusterId);
    }

    /* =========================================================
       ✅ MISSING ENDPOINTS (THIS FIXES YOUR PROBLEM)
       ========================================================= */

    // ✅ Adjuster assigns claim to Investigator
    @PutMapping("/{claimId}/assign-investigator/{investigatorId}")
    public Claim assignClaimToInvestigator(@PathVariable Long claimId, @PathVariable Long investigatorId) {
        return claimService.assignClaimToInvestigator(claimId, investigatorId);
    }

    // ✅ Adjuster assigns claim to Underwriter
    @PutMapping("/{claimId}/assign-underwriter/{underwriterId}")
    public Claim assignClaimToUnderwriter(@PathVariable Long claimId, @PathVariable Long underwriterId) {
        return claimService.assignClaimToUnderwriter(claimId, underwriterId);
    }
}
