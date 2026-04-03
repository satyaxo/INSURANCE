package com.edutech.insurance_claims_processing_system.controller;

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

    // ✅ Get claims for Underwriter
    @GetMapping("/underwriter/{id}")
    public List<Claim> getClaimsByUnderwriter(@PathVariable Long id) {
        // If you already have claimService.getClaimsForReview(id), use it
        return claimService.getClaimsForReview(id);
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
       ✅ ADJUSTER ENDPOINTS (THIS IS WHAT YOU NEED)
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

    // ✅ Adjuster assigns a claim to themselves (or admin assigns)
    @PutMapping("/{claimId}/assign-adjuster/{adjusterId}")
    public Claim assignClaimToAdjuster(@PathVariable Long claimId, @PathVariable Long adjusterId) {
        return claimService.assignClaimToAdjuster(claimId, adjusterId);
    }
}

// package com.edutech.insurance_claims_processing_system.controller;

// import com.edutech.insurance_claims_processing_system.entity.Claim;
// import com.edutech.insurance_claims_processing_system.repository.ClaimRepository;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.web.bind.annotation.*;

// import java.util.List;

// @RestController
// @RequestMapping("/api/claims")
// @CrossOrigin(origins = "*")
// public class ClaimController {

//     @Autowired
//     private ClaimRepository claimRepository;

//     // ✅ Get all claims (optional)
//     @GetMapping
//     public List<Claim> getAllClaims() {
//         return claimRepository.findAll();
//     }

//     // ✅ Get claims for Underwriter
//     @GetMapping("/underwriter/{id}")
//     public List<Claim> getClaimsByUnderwriter(@PathVariable Long id) {
//         return claimRepository.findByUnderwriterId(id);
//     }



//     // ✅ Update claim status (Approve / Reject)
//     @PutMapping("/{id}/status")
//     public Claim updateStatus(@PathVariable Long id, @RequestBody Claim updatedClaim) {

//         Claim claim = claimRepository.findById(id).orElseThrow();

//         claim.setStatus(updatedClaim.getStatus());

//         return claimRepository.save(claim);
//     }
// }