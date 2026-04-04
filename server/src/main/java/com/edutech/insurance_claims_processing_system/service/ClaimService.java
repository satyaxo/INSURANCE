package com.edutech.insurance_claims_processing_system.service;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.edutech.insurance_claims_processing_system.dto.PolicyholderClaimTrackingDTO;
import com.edutech.insurance_claims_processing_system.dto.UnderwriterClaimDTO;
import com.edutech.insurance_claims_processing_system.entity.Adjuster;
import com.edutech.insurance_claims_processing_system.entity.Claim;
import com.edutech.insurance_claims_processing_system.entity.Investigator;
import com.edutech.insurance_claims_processing_system.entity.Policyholder;
import com.edutech.insurance_claims_processing_system.entity.Underwriter;
import com.edutech.insurance_claims_processing_system.repository.AdjusterRepository;
import com.edutech.insurance_claims_processing_system.repository.ClaimRepository;
import com.edutech.insurance_claims_processing_system.repository.InvestigatorRepository;
import com.edutech.insurance_claims_processing_system.repository.PolicyholderRepository;
import com.edutech.insurance_claims_processing_system.repository.UnderwriterRepository;

@Service
public class ClaimService {

    private final ClaimRepository claimRepository;
    private final PolicyholderRepository policyholderRepository;
    private final UnderwriterRepository underwriterRepository;
    private final InvestigatorRepository investigatorRepository;
    private final AdjusterRepository adjusterRepository;

    // ✅ Deadline rules (realtime-like / industry simplified)
    // Motor/Travel -> 7 days ; Others -> 30 days
    private static final int DEADLINE_MOTOR_DAYS = 7;
    private static final int DEADLINE_DEFAULT_DAYS = 30;

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

    public Claim createClaim(Claim claim) {
        if (claim == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Claim body is required");
        }

        if (claim.getDate() == null) {
            claim.setDate(new Date());
        }

        if (claim.getStatus() == null || claim.getStatus().trim().isEmpty()) {
            claim.setStatus("SUBMITTED");
        }

        return claimRepository.save(claim);
    }

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

    public List<Claim> getAllClaims() {
        return claimRepository.findAll();
    }

    /**
     * ✅ Policyholder submits claim
     * Rules:
     * - insuranceType required
     * - policyNumber must match ^#\\d+$
     * - accident date must not be future
     * - claim must be filed within allowed deadline based on insuranceType
     */
    public Claim submitClaim(Long policyholderId, Claim claim) {
        if (policyholderId == null || claim == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid request");
        }

        if (claim.getInsuranceType() == null || claim.getInsuranceType().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insurance type is required");
        }

        if (claim.getPolicyNumber() == null || claim.getPolicyNumber().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Policy number is required");
        }

        String pn = claim.getPolicyNumber().trim();
        if (!pn.matches("^#\\d+$")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Policy number must start with # and contain digits only (example: #12345678)"
            );
        }

        if (claim.getDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Accident date is required");
        }

        Date accidentDate = claim.getDate();
        Date today = new Date();

        if (accidentDate.after(today)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Accident date cannot be in the future");
        }

        int deadlineDays = getDeadlineDaysByInsuranceType(claim.getInsuranceType());

        long diffMillis = today.getTime() - accidentDate.getTime();
        long diffDays = diffMillis / (1000L * 60 * 60 * 24);

        if (diffDays > deadlineDays) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Claim must be filed within " + deadlineDays + " days of the accident date"
            );
        }

        Policyholder policyholder = policyholderRepository.findById(policyholderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Policyholder not found"));

        claim.setPolicyholder(policyholder);
        claim.setStatus("SUBMITTED");

        return claimRepository.save(claim);
    }

    // ✅ Deadline rules per type (simple + realistic)
    private int getDeadlineDaysByInsuranceType(String insuranceType) {
        if (insuranceType == null) return DEADLINE_DEFAULT_DAYS;

        String t = insuranceType.trim().toUpperCase();

        if ("CAR".equals(t) || "BIKE".equals(t) || "TRAVEL".equals(t)) {
            return DEADLINE_MOTOR_DAYS;
        }

        return DEADLINE_DEFAULT_DAYS;
    }

    public List<Claim> getClaimsByPolicyholder(Long policyholderId) {
        if (policyholderId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid request");
        }

        Policyholder policyholder = policyholderRepository.findById(policyholderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Policyholder not found"));

        return claimRepository.findByPolicyholder(policyholder);
    }

    public List<Claim> getClaimsForReview(Long underwriterId) {
        if (underwriterId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid request");
        }

        Underwriter underwriter = underwriterRepository.findById(underwriterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Underwriter not found"));

        return claimRepository.findByUnderwriter(underwriter);
    }

    public Claim assignClaimToUnderwriter(Long claimId, Long underwriterId) {
        if (claimId == null || underwriterId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid request");
        }

        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found"));

        Underwriter underwriter = underwriterRepository.findById(underwriterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Underwriter not found"));

        claim.setUnderwriter(underwriter);
        claim.setStatus("UNDER_REVIEW");

        return claimRepository.save(claim);
    }

    public Claim assignClaimToInvestigator(Long claimId, Long investigatorId) {
        if (claimId == null || investigatorId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid request");
        }

        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found"));

        Investigator investigator = investigatorRepository.findById(investigatorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Investigator not found"));

        claim.setInvestigator(investigator);
        claim.setStatus("INVESTIGATION_IN_PROGRESS");

        return claimRepository.save(claim);
    }

    public List<Claim> getClaimsByInvestigator(Long investigatorId) {
        if (investigatorId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid request");
        }

        Investigator investigator = investigatorRepository.findById(investigatorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Investigator not found"));

        return claimRepository.findByInvestigator(investigator);
    }

    // Update page inbox: SUBMITTED only
    public List<Claim> getUnassignedSubmittedClaims() {
        return claimRepository.findByAdjusterIsNullAndStatus("SUBMITTED");
    }

    // ✅ FIXED: Ready-to-Assign should show claims where investigator OR underwriter is still missing
    public List<Claim> getAssignableClaimsForAdjuster() {
        // Requires ClaimRepository.findAssignableClaims("UNDER_PROGRESS")
        return claimRepository.findAssignableClaims("UNDER_PROGRESS");
    }

    public List<Claim> getClaimsByAdjuster(Long adjusterId) {
        if (adjusterId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid request");
        }

        Adjuster adjuster = adjusterRepository.findById(adjusterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Adjuster not found"));

        return claimRepository.findByAdjuster(adjuster);
    }

    public Claim assignClaimToAdjuster(Long claimId, Long adjusterId) {
        if (claimId == null || adjusterId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid request");
        }

        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found"));

        Adjuster adjuster = adjusterRepository.findById(adjusterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Adjuster not found"));

        claim.setAdjuster(adjuster);
        claim.setStatus("ASSIGNED_TO_ADJUSTER");

        return claimRepository.save(claim);
    }

    public List<Claim> getClaimsForUnderwriter(Long underwriterId) {
        if (underwriterId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid request");
        }
        return claimRepository.findClaimsWithInvestigation(underwriterId);
    }

    public Claim reviewClaim(Long id, String status) {
        Claim claim = claimRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found"));

        if (claim.getInvestigation() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Investigation report not completed yet");
        }

        if (status == null ||
                (!"APPROVED".equalsIgnoreCase(status) && !"REJECTED".equalsIgnoreCase(status))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status");
        }

        claim.setStatus(status.toUpperCase());
        return claimRepository.save(claim);
    }

    // ✅ Underwriter DTO
    public List<UnderwriterClaimDTO> getUnderwriterClaimsWithReport(Long underwriterId) {
        if (underwriterId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid request");
        }

        List<Claim> claims = claimRepository.findClaimsWithInvestigation(underwriterId);
        List<UnderwriterClaimDTO> result = new ArrayList<UnderwriterClaimDTO>();

        for (Claim c : claims) {
            String invStatus = null;
            String invReport = null;

            if (c.getInvestigation() != null) {
                invStatus = c.getInvestigation().getStatus();
                invReport = c.getInvestigation().getReport();
            }

            UnderwriterClaimDTO dto = new UnderwriterClaimDTO(
                    c.getId(),
                    c.getDescription(),
                    c.getStatus(),
                    invStatus,
                    invReport
            );
            result.add(dto);
        }

        return result;
    }

    // ✅ Policyholder tracking DTO
    public List<PolicyholderClaimTrackingDTO> getPolicyholderClaimsTracking(Long policyholderId) {
        if (policyholderId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid request");
        }

        List<Claim> claims = claimRepository.findPolicyholderClaimsWithInvestigation(policyholderId);
        List<PolicyholderClaimTrackingDTO> result = new ArrayList<PolicyholderClaimTrackingDTO>();

        for (Claim c : claims) {

            String investigationStatus = null;
            if (c.getInvestigation() != null) {
                investigationStatus = c.getInvestigation().getStatus();
            }

            String stage = computeStage(c.getStatus());

            result.add(new PolicyholderClaimTrackingDTO(
                    c.getId(),
                    c.getInsuranceType(),
                    c.getPolicyNumber(),
                    c.getDescription(),
                    c.getDate(),
                    c.getStatus(),
                    investigationStatus,
                    stage
            ));
        }

        return result;
    }

    private String computeStage(String status) {
        if (status == null) return "SUBMITTED";

        String s = status.toUpperCase();

        if ("SUBMITTED".equals(s)) return "SUBMITTED";
        if ("IN_PROGRESS".equals(s) || "UNDER_PROGRESS".equals(s) || "ASSIGNED_TO_ADJUSTER".equals(s)) return "ADJUSTER_REVIEW";
        if ("INVESTIGATION_IN_PROGRESS".equals(s)) return "INVESTIGATION";
        if ("INVESTIGATION_COMPLETED".equals(s)) return "INVESTIGATION_COMPLETED";
        if ("UNDER_REVIEW".equals(s)) return "UNDERWRITER_REVIEW";
        if ("APPROVED".equals(s)) return "APPROVED";
        if ("REJECTED".equals(s)) return "REJECTED";

        return s;
    }
}