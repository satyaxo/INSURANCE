package com.edutech.insurance_claims_processing_system.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.edutech.insurance_claims_processing_system.entity.Investigation;
import com.edutech.insurance_claims_processing_system.repository.InvestigationRepository;

import javax.persistence.EntityNotFoundException;
import java.util.List;

@Service
public class InvestigationService {

    

     private final InvestigationRepository investigationRepository;

    /**
     * Default constructor with @Autowired dependencies.
     */
    @Autowired
    public InvestigationService(InvestigationRepository investigationRepository) {
        this.investigationRepository = investigationRepository;
    }

    /**
     * Creates a new investigation.
     */
    public Investigation createInvestigation(Investigation investigation) {
        return investigationRepository.save(investigation);
    }

    /**
     * Updates an investigation’s details by ID.
     */
    public Investigation updateInvestigation(Long id, Investigation investigationDetails) {
        Investigation existingInvestigation = investigationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Investigation not found with ID: " + id));

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
