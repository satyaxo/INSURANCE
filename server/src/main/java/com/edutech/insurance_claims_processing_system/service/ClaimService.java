package com.edutech.insurance_claims_processing_system.service;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.edutech.insurance_claims_processing_system.entity.Claim;
import com.edutech.insurance_claims_processing_system.entity.Policyholder;
import com.edutech.insurance_claims_processing_system.entity.Underwriter;
import com.edutech.insurance_claims_processing_system.repository.ClaimRepository;
import com.edutech.insurance_claims_processing_system.repository.PolicyholderRepository;
import com.edutech.insurance_claims_processing_system.repository.UnderwriterRepository;

import javax.persistence.EntityNotFoundException;

import java.util.Date;
import java.util.List;

@Service
public class ClaimService {



     private final ClaimRepository claimRepository;
    private final PolicyholderRepository policyholderRepository;
    private final UnderwriterRepository underwriterRepository;

    /**
     * Default constructor with @Autowired dependencies.
     */
    @Autowired
    public ClaimService(
            ClaimRepository claimRepository,
            PolicyholderRepository policyholderRepository,
            UnderwriterRepository underwriterRepository) {
        this.claimRepository = claimRepository;
        this.policyholderRepository = policyholderRepository;
        this.underwriterRepository = underwriterRepository;
    }

    /**
     * Creates a new claim.
     */
    public Claim createClaim(Claim claim) {
        claim.setDate(new Date());
        claim.setStatus("Submitted");
        return claimRepository.save(claim);
    }

    /**
     * Updates claim details by ID.
     */
    public Claim updateClaim(Long id, Claim claimDetails) {
        Claim existingClaim = claimRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Claim not found with ID: " + id));

        existingClaim.setDescription(claimDetails.getDescription());
        existingClaim.setStatus(claimDetails.getStatus());

        return claimRepository.save(existingClaim);
    }

    /**
     * Retrieves all claims.
     */
    public List<Claim> getAllClaims() {
        return claimRepository.findAll();
    }

    /**
     * Submits a claim for a specific policyholder.
     */
    public Claim submitClaim(Long policyholderId, Claim claim) {
        Policyholder policyholder = policyholderRepository.findById(policyholderId)
                .orElseThrow(() -> new RuntimeException("Policyholder not found with ID: " + policyholderId));

        claim.setPolicyholder(policyholder);
        claim.setDate(new Date());
        claim.setStatus("Submitted");

        return claimRepository.save(claim);
    }

    /**
     * Fetches all claims associated with a policyholder.
     */
    public List<Claim> getClaimsByPolicyholder(Long policyholderId) {
        Policyholder policyholder = policyholderRepository.findById(policyholderId)
                .orElseThrow(() -> new RuntimeException("Policyholder not found with ID: " + policyholderId));

        return claimRepository.findByPolicyholder(policyholder);
    }

    /**
     * Updates claim status during review.
     */
    public Claim reviewClaim(Long id, String status) {
        Claim claim = claimRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Claim not found with ID: " + id));

        claim.setStatus(status);
        return claimRepository.save(claim);
    }

    /**
     * Retrieves claims assigned to a specific underwriter.
     */
    public List<Claim> getClaimsForReview(Long underwriterId) {
        Underwriter underwriter = underwriterRepository.findById(underwriterId)
                .orElseThrow(() -> new RuntimeException("Underwriter not found with ID: " + underwriterId));

        return claimRepository.findByUnderwriter(underwriter);
    }

    /**
     * Assigns a claim to an underwriter.
     */
    public Claim assignClaimToUnderwriter(Long claimId, Long underwriterId) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new RuntimeException("Claim not found with ID: " + claimId));

        Underwriter underwriter = underwriterRepository.findById(underwriterId)
                .orElseThrow(() -> new RuntimeException("Underwriter not found with ID: " + underwriterId));

        claim.setUnderwriter(underwriter);
        claim.setStatus("Under Review");

        return claimRepository.save(claim);
    }




}
