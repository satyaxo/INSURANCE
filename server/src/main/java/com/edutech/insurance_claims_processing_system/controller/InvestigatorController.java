package com.edutech.insurance_claims_processing_system.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.edutech.insurance_claims_processing_system.entity.Investigation;
import com.edutech.insurance_claims_processing_system.service.InvestigationService;

import java.util.List;

@RestController
@RequestMapping("/api/investigator")
public class InvestigatorController {

  @Autowired
    private InvestigationService investigationService;

    /**
     * Creates a new investigation.
     */
    @PostMapping("/investigation")
    public ResponseEntity<Investigation> createInvestigation(
            @RequestBody Investigation investigation) {

        Investigation createdInvestigation =
                investigationService.createInvestigation(investigation);

        return ResponseEntity.ok(createdInvestigation);
    }

    /**
     * Updates an existing investigation based on its ID.
     */
    @PutMapping("/investigation/{id}")
    public ResponseEntity<Investigation> updateInvestigation(
            @PathVariable Long id,
            @RequestBody Investigation investigationDetails) {

        Investigation updatedInvestigation =
                investigationService.updateInvestigation(id, investigationDetails);

        return ResponseEntity.ok(updatedInvestigation);
    }

    /**
     * Retrieves all investigations.
     */
    @GetMapping("/investigations")
    public List<Investigation> getAllInvestigations() {
        return investigationService.getAllInvestigations();
    }


}
