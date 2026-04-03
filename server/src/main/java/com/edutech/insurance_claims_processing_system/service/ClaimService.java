
package com.edutech.insurance_claims_processing_system.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.edutech.insurance_claims_processing_system.entity.Claim;
import com.edutech.insurance_claims_processing_system.entity.Investigator;
import com.edutech.insurance_claims_processing_system.entity.Policyholder;
import com.edutech.insurance_claims_processing_system.entity.Underwriter;
import com.edutech.insurance_claims_processing_system.entity.Adjuster;

import com.edutech.insurance_claims_processing_system.repository.ClaimRepository;
import com.edutech.insurance_claims_processing_system.repository.InvestigatorRepository;
import com.edutech.insurance_claims_processing_system.repository.PolicyholderRepository;
import com.edutech.insurance_claims_processing_system.repository.UnderwriterRepository;
import com.edutech.insurance_claims_processing_system.repository.AdjusterRepository;

import java.util.Date;
import java.util.List;

@Service
public class ClaimService {

    private final ClaimRepository claimRepository;
    private final PolicyholderRepository policyholderRepository;
    private final UnderwriterRepository underwriterRepository;
    private final InvestigatorRepository investigatorRepository;
    private final AdjusterRepository adjusterRepository;

    @Autowired
    public ClaimService(
            ClaimRepository claimRepository,
            PolicyholderRepository policyholderRepository,
            UnderwriterRepository underwriterRepository,
            InvestigatorRepository investigatorRepository,
            AdjusterRepository adjusterRepository
    ) {
        this.claimRepository = claimRepository;
        this.policyholderRepository = policyholderRepository;
        this.underwriterRepository = underwriterRepository;
        this.investigatorRepository = investigatorRepository;
        this.adjusterRepository = adjusterRepository;
    }

    /** Creates a new claim (generic). */
    public Claim createClaim(Claim claim) {
        if (claim == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Claim body is required");
        }

        // Don’t overwrite if frontend already sends date, otherwise set now
        if (claim.getDate() == null) {
            claim.setDate(new Date());
        }

        // Ensure status always set for newly created claims
        if (claim.getStatus() == null || claim.getStatus().isBlank()) {
            claim.setStatus("SUBMITTED");
        }

        return claimRepository.save(claim);
    }

    /** Updates claim details by ID. */
    public Claim updateClaim(Long id, Claim claimDetails) {
        if (id == null || claimDetails == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid request");
        }

        Claim existingClaim = claimRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found"));

        existingClaim.setDescription(claimDetails.getDescription());
        existingClaim.setStatus(claimDetails.getStatus());

        return claimRepository.save(existingClaim);
    }

    /** Retrieves all claims. */
    public List<Claim> getAllClaims() {
        return claimRepository.findAll();
    }

    /** Submits a claim for a specific policyholder. */
    public Claim submitClaim(Long policyholderId, Claim claim) {
        if (policyholderId == null || claim == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid request");
        }

        Policyholder policyholder = policyholderRepository.findById(policyholderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Policyholder not found"));

        claim.setPolicyholder(policyholder);
        claim.setDate(new Date());
        claim.setStatus("SUBMITTED");

        // IMPORTANT: claim is unassigned initially
        // claim.setAdjuster(null);

        return claimRepository.save(claim);
    }

    /** Fetches all claims associated with a policyholder. */
    public List<Claim> getClaimsByPolicyholder(Long policyholderId) {
        if (policyholderId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid request");
        }

        Policyholder policyholder = policyholderRepository.findById(policyholderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Policyholder not found"));

        return claimRepository.findByPolicyholder(policyholder);
    }

    /** Underwriter review (only after investigation report exists). */
    public Claim reviewClaim(Long id, String status) {
        Claim claim = claimRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found"));

        if (claim.getInvestigation() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Investigation report not completed yet");
        }

        if (!"APPROVED".equalsIgnoreCase(status) && !"REJECTED".equalsIgnoreCase(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status");
        }

        claim.setStatus(status.toUpperCase());
        return claimRepository.save(claim);
    }

    /** Retrieves claims assigned to a specific underwriter. */
    public List<Claim> getClaimsForReview(Long underwriterId) {
        if (underwriterId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid request");
        }

        Underwriter underwriter = underwriterRepository.findById(underwriterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Underwriter not found"));

        return claimRepository.findByUnderwriter(underwriter);
    }

    /** Assigns a claim to an underwriter. */
    public Claim assignClaimToUnderwriter(Long claimId, Long underwriterId) {
        if (claimId == null || underwriterId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid request");
        }

        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found"));

        Underwriter underwriter = underwriterRepository.findById(underwriterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Underwriter not found"));

        claim.setUnderwriter(underwriter);
        claim.setStatus("UNDER_REVIEW"); // safer than "UNDER REVIEW"

        return claimRepository.save(claim);
    }

    /** Assigns a claim to an investigator. */
    public Claim assignClaimToInvestigator(Long claimId, Long investigatorId) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found"));

        Investigator investigator = investigatorRepository.findById(investigatorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Investigator not found"));

        claim.setInvestigator(investigator);
        claim.setStatus("INVESTIGATION_IN_PROGRESS");

        return claimRepository.save(claim);
    }

    public List<Claim> getClaimsByInvestigator(Long investigatorId) {
        Investigator investigator = investigatorRepository.findById(investigatorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Investigator not found"));

        return claimRepository.findByInvestigator(investigator);
    }

    /* =========================================================
       ✅ ADJUSTER WORKFLOW (THIS IS WHAT YOU NEED NOW)
       ========================================================= */

    /** Adjuster should see NEW claims that are not assigned yet (SUBMITTED + adjuster_id NULL). */
    public List<Claim> getUnassignedSubmittedClaims() {
        return claimRepository.findByAdjusterIsNullAndStatus("SUBMITTED");
    }

    /** Adjuster can also see claims already assigned to them. */
    public List<Claim> getClaimsByAdjuster(Long adjusterId) {
        Adjuster adjuster = adjusterRepository.findById(adjusterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Adjuster not found"));

        return claimRepository.findByAdjuster(adjuster);
    }

    /** Assign claim to adjuster ("Assign to me"). */
    public Claim assignClaimToAdjuster(Long claimId, Long adjusterId) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found"));

        Adjuster adjuster = adjusterRepository.findById(adjusterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Adjuster not found"));

        claim.setAdjuster(adjuster);
        claim.setStatus("ASSIGNED_TO_ADJUSTER");

        return claimRepository.save(claim);
    }

    public List<Claim> getClaimsForUnderwriter(Long underwriterId) {
        Underwriter underwriter = underwriterRepository.findById(underwriterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Underwriter not found"));

        return claimRepository.findClaimsWithInvestigation(underwriterId);
    }
}