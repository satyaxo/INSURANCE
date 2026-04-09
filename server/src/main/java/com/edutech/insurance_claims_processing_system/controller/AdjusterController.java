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
@CrossOrigin(origins = "*")
public class AdjusterController {

    @Autowired
    private ClaimService claimService;

    @Autowired
    private UnderwriterRepository underwriterRepository;

    @Autowired
    private InvestigatorRepository investigatorRepository;

    // ✅ Update page: show only SUBMITTED claims
    @GetMapping("/claims")
    public List<Claim> getNewUnassignedClaims() {
        return claimService.getUnassignedSubmittedClaims();
    }

    // ✅ Assign page dropdown should use this endpoint
    @GetMapping("/claims/assignable")
    public List<Claim> getAssignableClaims() {
        return claimService.getAssignableClaimsForAdjuster();
    }

    @GetMapping("/claims/all")
    public List<Claim> getAllClaims() {
        return claimService.getAllClaims();
    }

    @GetMapping("/claims/assigned/{adjusterId}")
    public List<Claim> getClaimsAssignedToAdjuster(@PathVariable Long adjusterId) {
        if (adjusterId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid adjusterId");
        }
        return claimService.getClaimsByAdjuster(adjusterId);
    }

    @PutMapping("/claim/{claimId}/assign-to-me")
    public ResponseEntity<Claim> assignClaimToMe(
            @PathVariable Long claimId,
            @RequestParam Long adjusterId) {

        if (claimId == null || adjusterId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid request");
        }
        return ResponseEntity.ok(claimService.assignClaimToAdjuster(claimId, adjusterId));
    }

    @PutMapping("/claim/{id}")
    public ResponseEntity<Claim> updateClaim(
            @PathVariable Long id,
            @RequestBody Claim claimDetails) {

        if (id == null || claimDetails == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid request");
        }
        return ResponseEntity.ok(claimService.updateClaim(id, claimDetails));
    }

    @GetMapping("/underwriters")
    public List<Underwriter> getAllUnderwriters() {
        return underwriterRepository.findAll();
    }

    @GetMapping("/investigators")
    public List<Investigator> getAllInvestigators() {
        return investigatorRepository.findAll();
    }

    // ✅ Assign Underwriter (single)
    @PutMapping("/claim/{claimId}/assign")
    public ResponseEntity<Claim> assignClaimToUnderwriter(
            @PathVariable Long claimId,
            @RequestParam Long underwriterId) {

        if (claimId == null || underwriterId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid request");
        }
        return ResponseEntity.ok(claimService.assignClaimToUnderwriter(claimId, underwriterId));
    }

    // ✅ Assign Investigator (single)
    @PutMapping("/claim/{claimId}/assign-investigator")
    public ResponseEntity<Claim> assignClaimToInvestigator(
            @PathVariable Long claimId,
            @RequestParam Long investigatorId) {

        if (claimId == null || investigatorId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid request");
        }
        return ResponseEntity.ok(claimService.assignClaimToInvestigator(claimId, investigatorId));
    }

    /* =========================================================
       ✅ NEW: Assign BOTH Investigator + Underwriter in ONE call
       =========================================================
       Why needed?
       - Prevents status being overwritten incorrectly due to call order.
       - Ensures claim ends up in UNDER_REVIEW so Underwriter dashboard shows it.
    */
    @PutMapping("/claim/{claimId}/assign-all")
    public ResponseEntity<Claim> assignClaimToBoth(
            @PathVariable Long claimId,
            @RequestParam Long investigatorId,
            @RequestParam Long underwriterId) {

        if (claimId == null || investigatorId == null || underwriterId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid request");
        }

        // ✅ Order matters:
        // investigator assignment may set status INVESTIGATION_IN_PROGRESS
        // underwriter assignment sets status UNDER_REVIEW
        // final status = UNDER_REVIEW -> Underwriter dashboard will show it
        claimService.assignClaimToInvestigator(claimId, investigatorId);
        Claim finalClaim = claimService.assignClaimToUnderwriter(claimId, underwriterId);

        return ResponseEntity.ok(finalClaim);
    }
}
