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

    public Investigation createInvestigation(Investigation investigation) {

        if (investigation == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid investigation");
        }

        if (investigation.getClaim() == null || investigation.getClaim().getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Claim id is required");
        }

        Long claimId = investigation.getClaim().getId();

        // ✅ Prevent duplicates
        if (investigationRepository.existsByClaimId(claimId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Investigation already exists for this claim. Please update it instead."
            );
        }

        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found"));

        investigation.setClaim(claim);

        Investigation savedInvestigation = investigationRepository.save(investigation);

        // ✅ Update claim status based on investigation status
        if ("COMPLETED".equalsIgnoreCase(investigation.getStatus())
                || "Completed".equalsIgnoreCase(investigation.getStatus())) {
            claim.setStatus("INVESTIGATION_COMPLETED");
        } else {
            claim.setStatus("INVESTIGATION_IN_PROGRESS");
        }

        claimRepository.save(claim);

        return savedInvestigation;
    }

    public Investigation updateInvestigation(Long id, Investigation investigationDetails) {

        if (id == null || investigationDetails == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid request");
        }

        Investigation existingInvestigation = investigationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Investigation not found"));

        // ✅ Block edits if already completed
        if ("COMPLETED".equalsIgnoreCase(existingInvestigation.getStatus())
                || "Completed".equalsIgnoreCase(existingInvestigation.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Completed investigation cannot be edited");
        }

        existingInvestigation.setReport(investigationDetails.getReport());
        existingInvestigation.setStatus(investigationDetails.getStatus());

        Investigation updated = investigationRepository.save(existingInvestigation);

        // ✅ update claim status
        if (("COMPLETED".equalsIgnoreCase(updated.getStatus())
                || "Completed".equalsIgnoreCase(updated.getStatus()))
                && updated.getClaim() != null) {

            Claim claim = updated.getClaim();
            claim.setStatus("INVESTIGATION_COMPLETED");
            claimRepository.save(claim);

        } else if (updated.getClaim() != null) {

            Claim claim = updated.getClaim();
            claim.setStatus("INVESTIGATION_IN_PROGRESS");
            claimRepository.save(claim);
        }

        return updated;
    }

    // ✅ Admin/global (keep if you want)
    public List<Investigation> getAllInvestigations() {
        return investigationRepository.findAllWithClaim();
    }

    // ✅ Investigator-only (THIS FIXES "why I see records without submitting")
    public List<Investigation> getInvestigationsByInvestigator(Long investigatorId) {
        if (investigatorId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid investigatorId");
        }
        return investigationRepository.findAllWithClaimByInvestigatorId(investigatorId);
    }
}
