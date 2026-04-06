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
@CrossOrigin(origins = "*")
public class InvestigatorController {

    @Autowired
    private InvestigationService investigationService;

    @Autowired
    private ClaimService claimService;

    @PostMapping("/investigation")
    public ResponseEntity<Investigation> createInvestigation(@RequestBody Investigation investigation) {

        if (investigation == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid request");
        }

        Investigation saved = investigationService.createInvestigation(investigation);

        // ✅ IMPORTANT FIX: if investigator completes report, move claim to UNDER_REVIEW
        moveClaimToUnderwriterReviewIfCompleted(saved);

        return ResponseEntity.ok(saved);
    }

    @PutMapping("/investigation/{id}")
    public ResponseEntity<Investigation> updateInvestigation(
            @PathVariable Long id,
            @RequestBody Investigation investigationDetails) {

        if (id == null || investigationDetails == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid request");
        }

        Investigation saved = investigationService.updateInvestigation(id, investigationDetails);

        // ✅ IMPORTANT FIX: if investigator completes report, move claim to UNDER_REVIEW
        moveClaimToUnderwriterReviewIfCompleted(saved);

        return ResponseEntity.ok(saved);
    }

    @GetMapping("/investigations")
    public List<Investigation> getAllInvestigations() {
        return investigationService.getAllInvestigations();
    }

    // ✅ Investigator receives assigned claims
    @GetMapping("/claims")
    public List<Claim> getAssignedClaims(@RequestParam Long investigatorId) {
        return claimService.getClaimsByInvestigator(investigatorId);
    }

    /* =========================================================
       ✅ Helper: if investigation status is completed => claim UNDER_REVIEW
       ========================================================= */
    private void moveClaimToUnderwriterReviewIfCompleted(Investigation inv) {

        if (inv == null) return;

        String st = inv.getStatus();
        if (st == null) return;

        // Accept both "Completed" and "INVESTIGATION_COMPLETED"
        String up = st.trim().toUpperCase();
        boolean completed = up.equals("COMPLETED") || up.contains("COMPLETED");

        if (!completed) return;

        if (inv.getClaim() == null || inv.getClaim().getId() == null) return;

        // ✅ Move claim to UNDER_REVIEW so underwriter dashboard can see it
        claimService.moveClaimToUnderwriterReview(inv.getClaim().getId());
    }
}
