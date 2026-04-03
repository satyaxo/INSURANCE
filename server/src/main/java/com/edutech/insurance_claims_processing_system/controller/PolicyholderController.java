package com.edutech.insurance_claims_processing_system.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.edutech.insurance_claims_processing_system.entity.Claim;
import com.edutech.insurance_claims_processing_system.service.ClaimService;
import org.springframework.web.multipart.MultipartFile;
import com.edutech.insurance_claims_processing_system.dto.ClaimDocumentDTO;
import java.util.List;

@RestController
@RequestMapping("/api/policyholder")
public class PolicyholderController {

    @Autowired
    private ClaimService claimService;

    /**
     * Submits a new claim for a policyholder.
     */
    @PostMapping("/claim")
    public ResponseEntity<Claim> submitClaim(
            @RequestParam(required = false) Long policyholderId,
            @RequestBody(required = false) Claim claim) {

        Claim submittedClaim =
                claimService.submitClaim(policyholderId, claim);

        return ResponseEntity.ok(submittedClaim);
    }

    /**
     * Retrieves all claims submitted by a specific policyholder.
     */
    @GetMapping("/claims")
    public ResponseEntity<List<Claim>> getClaims(
            @RequestParam(required = false) Long policyholderId) {

        List<Claim> claims =
                claimService.getClaimsByPolicyholder(policyholderId);

        return ResponseEntity.ok(claims);
    }
  // Upload documents
@PostMapping("/policyholder/claim/{claimId}/documents")
public ResponseEntity<?> uploadDocuments(
    @PathVariable Long claimId,
    @RequestParam("files") List<MultipartFile> files) {
    claimService.saveDocuments(claimId, files);
    return ResponseEntity.ok("Uploaded successfully");
}

// Get documents
@GetMapping("/policyholder/claim/{claimId}/documents")
public ResponseEntity<List<ClaimDocumentDTO>> getDocuments(@PathVariable Long claimId) {
    return ResponseEntity.ok(claimService.getDocuments(claimId));
}

@DeleteMapping("/claim/{id}")
public ResponseEntity<String> deleteClaim(@PathVariable Long id) {
    claimService.deleteClaim(id);
    return ResponseEntity.ok("Deleted successfully");
}

}