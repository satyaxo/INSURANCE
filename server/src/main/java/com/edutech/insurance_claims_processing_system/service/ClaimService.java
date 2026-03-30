package com.edutech.insurance_claims_processing_system.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.edutech.insurance_claims_processing_system.entity.Claim;
import com.edutech.insurance_claims_processing_system.entity.Policyholder;
import com.edutech.insurance_claims_processing_system.entity.Underwriter;
import com.edutech.insurance_claims_processing_system.repository.ClaimRepository;
import com.edutech.insurance_claims_processing_system.repository.PolicyholderRepository;
import com.edutech.insurance_claims_processing_system.repository.UnderwriterRepository;

import java.util.Date;
import java.util.List;

@Service
public class ClaimService {

    private final ClaimRepository claimRepository;
    private final PolicyholderRepository policyholderRepository;
    private final UnderwriterRepository underwriterRepository;

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
        if (claim == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        claim.setDate(new Date());
        // claim.setStatus("SUBMITTED");
        return claimRepository.save(claim);
    }

    /**
     * Updates claim details by ID.
     */
  public Claim updateClaim(Long id, Claim claimDetails) {
    if (id == null || claimDetails == null) {
        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Access denied"
        );
    }

    Claim existingClaim = claimRepository.findById(id)
            .orElseThrow(() ->
                    new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied"));

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
        if (policyholderId == null || claim == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        Policyholder policyholder = policyholderRepository.findById(policyholderId)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied"));

        claim.setPolicyholder(policyholder);
        claim.setDate(new Date());
        claim.setStatus("SUBMITTED");

        return claimRepository.save(claim);
    }

    /**
     * Fetches all claims associated with a policyholder.
     */
    public List<Claim> getClaimsByPolicyholder(Long policyholderId) {
        if (policyholderId == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        Policyholder policyholder = policyholderRepository.findById(policyholderId)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied"));

        return claimRepository.findByPolicyholder(policyholder);
    }

    /**
     * Updates claim status during review.
     */
    public Claim reviewClaim(Long id, String status) {
        if (id == null || status == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        Claim claim = claimRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied"));

        claim.setStatus(status);
        return claimRepository.save(claim);
    }

    /**
     * Retrieves claims assigned to a specific underwriter.
     */
    public List<Claim> getClaimsForReview(Long underwriterId) {
        if (underwriterId == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        Underwriter underwriter = underwriterRepository.findById(underwriterId)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied"));

        return claimRepository.findByUnderwriter(underwriter);
    }

    /**
     * Assigns a claim to an underwriter.
     */
    public Claim assignClaimToUnderwriter(Long claimId, Long underwriterId) {
        if (claimId == null || underwriterId == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied"));

        Underwriter underwriter = underwriterRepository.findById(underwriterId)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied"));

        claim.setUnderwriter(underwriter);
        claim.setStatus("UNDER REVIEW");

        return claimRepository.save(claim);
    }
}