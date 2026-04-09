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
        moveClaimToUnderwriterReviewIfCompleted(saved);

        return ResponseEntity.ok(saved);
    }

    // ✅ FIX: Investigator should not get ALL investigations
    @GetMapping("/investigations")
    public List<Investigation> getInvestigations(@RequestParam Long investigatorId) {
        return investigationService.getInvestigationsByInvestigator(investigatorId);
    }

    // ✅ Investigator receives assigned claims
    @GetMapping("/claims")
    public List<Claim> getAssignedClaims(@RequestParam Long investigatorId) {
        return claimService.getClaimsByInvestigator(investigatorId);
    }

    private void moveClaimToUnderwriterReviewIfCompleted(Investigation inv) {
        if (inv == null) return;

        String st = inv.getStatus();
        if (st == null) return;

        String up = st.trim().toUpperCase();
        boolean completed = up.equals("COMPLETED") || up.contains("COMPLETED");
        if (!completed) return;

        if (inv.getClaim() == null || inv.getClaim().getId() == null) return;

        claimService.moveClaimToUnderwriterReview(inv.getClaim().getId());
    }
}