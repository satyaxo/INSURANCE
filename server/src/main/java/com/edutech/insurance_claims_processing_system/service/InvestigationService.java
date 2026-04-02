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
     * Creates a new investigation and moves the claim to underwriter stage.
     */
    public Investigation createInvestigation(Investigation investigation) {

        if (investigation == null || investigation.getClaim() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid investigation");
        }

        // ✅ Save investigation
        Investigation savedInvestigation = investigationRepository.save(investigation);

        // ✅ Update claim status after investigation
        Claim claim = investigation.getClaim();
        claim.setStatus("INVESTIGATION_COMPLETED");

        claimRepository.save(claim);

        return savedInvestigation;
    }

    /**
     * Updates an investigation’s details by ID.
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

        // ✅ Optional: also update claim status if investigation completed
        if ("Completed".equalsIgnoreCase(investigationDetails.getStatus())
                && existingInvestigation.getClaim() != null) {

            Claim claim = existingInvestigation.getClaim();
            claim.setStatus("INVESTIGATION_COMPLETED");
            claimRepository.save(claim);
        }

        return investigationRepository.save(existingInvestigation);
    }

    /**
     * Retrieves all investigations.
     */
  public List<Investigation> getAllInvestigations() {
    return investigationRepository.findAllWithClaim();
}


}