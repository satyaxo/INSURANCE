package com.edutech.insurance_claims_processing_system.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.edutech.insurance_claims_processing_system.entity.Claim;
import com.edutech.insurance_claims_processing_system.entity.Investigation;
import com.edutech.insurance_claims_processing_system.repository.ClaimRepository;
import com.edutech.insurance_claims_processing_system.repository.InvestigationRepository;

import java.util.List;

@Service
public class InvestigationService {

    private final InvestigationRepository investigationRepository;
    private final ClaimRepository claimRepository;

    @Autowired
    public InvestigationService(
            InvestigationRepository investigationRepository,
            ClaimRepository claimRepository) {
        this.investigationRepository = investigationRepository;
        this.claimRepository = claimRepository;
    }

    /**
     * ✅ Create investigation (UPSERT) and move claim to underwriter stage.
     * - Prevents duplicate investigations for same claim
     * - Preserves claim relations (underwriter/investigator/adjuster)
     */
    public Investigation createInvestigation(Investigation investigation) {

        if (investigation == null
                || investigation.getClaim() == null
                || investigation.getClaim().getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Claim must be provided");
        }

        Long claimId = investigation.getClaim().getId();

        // ✅ Always load the managed claim from DB (prevents overwriting relations)
        Claim existingClaim = claimRepository.findById(claimId)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found"));

        // ✅ UPSERT: if investigation exists for this claim, UPDATE it; else CREATE new
        Investigation savedInvestigation = investigationRepository.findByClaimId(claimId)
                .map(existingInv -> {
                    existingInv.setReport(investigation.getReport());
                    existingInv.setStatus(investigation.getStatus());
                    existingInv.setClaim(existingClaim);
                    return investigationRepository.save(existingInv);
                })
                .orElseGet(() -> {
                    investigation.setClaim(existingClaim);
                    return investigationRepository.save(investigation);
                });

        // ✅ Update only claim status after investigation
        existingClaim.setStatus("INVESTIGATION_COMPLETED");
        claimRepository.save(existingClaim);

        return savedInvestigation;
    }

    /**
     * Updates an investigation’s details by ID.
     * ✅ Safe update (does not create duplicates)
     */
    public Investigation updateInvestigation(Long id, Investigation investigationDetails) {

        if (id == null || investigationDetails == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid request");
        }

        Investigation existingInvestigation = investigationRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Investigation not found"));

        existingInvestigation.setReport(investigationDetails.getReport());
        existingInvestigation.setStatus(investigationDetails.getStatus());

        // ✅ Keep current claim link unless a valid claim id is provided
        if (investigationDetails.getClaim() != null && investigationDetails.getClaim().getId() != null) {
            Claim existingClaim = claimRepository.findById(investigationDetails.getClaim().getId())
                    .orElseThrow(() ->
                            new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found"));
            existingInvestigation.setClaim(existingClaim);
        }

        // ✅ If completed, update claim status
        if ("Completed".equalsIgnoreCase(existingInvestigation.getStatus())
                && existingInvestigation.getClaim() != null) {
            Claim claim = existingInvestigation.getClaim();
            claim.setStatus("INVESTIGATION_COMPLETED");
            claimRepository.save(claim);
        }

        return investigationRepository.save(existingInvestigation);
    }

    /**
     * Retrieves all investigations with claim.
     */
    public List<Investigation> getAllInvestigations() {
        return investigationRepository.findAllWithClaim();
    }
}