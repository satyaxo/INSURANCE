package com.edutech.insurance_claims_processing_system.controller;

import com.edutech.insurance_claims_processing_system.entity.Claim;
import com.edutech.insurance_claims_processing_system.repository.ClaimRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/claims")
@CrossOrigin(origins = "*")
public class ClaimController {

    @Autowired
    private ClaimRepository claimRepository;

    // ✅ Get all claims (optional)
    @GetMapping
    public List<Claim> getAllClaims() {
        return claimRepository.findAll();
    }

    // ✅ Get claims for Underwriter
    @GetMapping("/underwriter/{id}")
    public List<Claim> getClaimsByUnderwriter(@PathVariable Long id) {
        return claimRepository.findByUnderwriterId(id);
    }



    // ✅ Update claim status (Approve / Reject)
    @PutMapping("/{id}/status")
    public Claim updateStatus(@PathVariable Long id, @RequestBody Claim updatedClaim) {

        Claim claim = claimRepository.findById(id).orElseThrow();

        claim.setStatus(updatedClaim.getStatus());

        return claimRepository.save(claim);
    }
}