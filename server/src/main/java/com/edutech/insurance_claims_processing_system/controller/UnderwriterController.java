package com.edutech.insurance_claims_processing_system.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.edutech.insurance_claims_processing_system.dto.UnderwriterClaimDTO;
import com.edutech.insurance_claims_processing_system.entity.Claim;
import com.edutech.insurance_claims_processing_system.service.ClaimService;

import java.util.List;

@RestController
@RequestMapping("/api/underwriter")
@CrossOrigin(origins = "*")
public class UnderwriterController {

    @Autowired
    private ClaimService claimService;

    // ✅ Get claims WITH investigator report (DTO)
    @GetMapping("/claims")
    public ResponseEntity<List<UnderwriterClaimDTO>> getClaimsForReview(
            @RequestParam Long underwriterId) {

        return ResponseEntity.ok(
                claimService.getUnderwriterClaimsWithReport(underwriterId)
        );
    }

    // ✅ Final decision (only after investigation)
    @PutMapping("/claim/{id}/review")
    public ResponseEntity<Claim> reviewClaim(
            @PathVariable Long id,
            @RequestParam String status) {

        return ResponseEntity.ok(
                claimService.reviewClaim(id, status)
        );
    }
}
