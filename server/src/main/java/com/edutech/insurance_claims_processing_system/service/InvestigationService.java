package com.edutech.insurance_claims_processing_system.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.edutech.insurance_claims_processing_system.entity.Investigation;
import com.edutech.insurance_claims_processing_system.repository.InvestigationRepository;

import java.util.List;

@Service
public class InvestigationService {

    private final InvestigationRepository investigationRepository;

    @Autowired
    public InvestigationService(InvestigationRepository investigationRepository) {
        this.investigationRepository = investigationRepository;
    }

    /**
     * Creates a new investigation.
     */
    public Investigation createInvestigation(Investigation investigation) {
        if (investigation == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        return investigationRepository.save(investigation);
    }

    /**
     * Updates an investigation’s details by ID.
     */
   public Investigation updateInvestigation(Long id, Investigation investigationDetails) {

    if (id == null || investigationDetails == null) {
        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Access denied"
        );
    }

    Investigation existingInvestigation = investigationRepository.findById(id)
            .orElseThrow(() ->
                    new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied"));

    existingInvestigation.setReport(investigationDetails.getReport());
    existingInvestigation.setStatus(investigationDetails.getStatus());
    existingInvestigation.setClaim(investigationDetails.getClaim());

    return investigationRepository.save(existingInvestigation);
}

    /**
     * Retrieves all investigations.
     */
    public List<Investigation> getAllInvestigations() {
        return investigationRepository.findAll();
    }
}