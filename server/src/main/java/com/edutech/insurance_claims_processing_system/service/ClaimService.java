package com.edutech.insurance_claims_processing_system.service;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

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
import com.edutech.insurance_claims_processing_system.entity.Policy; // ✅ NEW
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

    // ✅ NEW: policy validation
    private final PolicyService policyService;

    // Motor/Travel -> 7 days ; Others -> 30 days
    private static final int DEADLINE_MOTOR_DAYS = 7;
    private static final int DEADLINE_DEFAULT_DAYS = 30;

    public ClaimService(
            ClaimRepository claimRepository,
            PolicyholderRepository policyholderRepository,
            UnderwriterRepository underwriterRepository,
            InvestigatorRepository investigatorRepository,
            AdjusterRepository adjusterRepository,
            PolicyService policyService // ✅ NEW
    ) {
        this.claimRepository = claimRepository;
        this.policyholderRepository = policyholderRepository;
        this.underwriterRepository = underwriterRepository;
        this.investigatorRepository = investigatorRepository;
        this.adjusterRepository = adjusterRepository;
        this.policyService = policyService;
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
     * - Policyholder must have ACTIVE + PAID policy
     * - insuranceType must match purchased policy
     * - policyNumber must match purchased policyNumber (or auto-filled)
     * - accident date not future
     * - filed within deadline days
     */
    public Claim submitClaim(Long policyholderId, Claim claim) {
        if (policyholderId == null || claim == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid request");
        }

        // =========================================================
        // ✅ POLICY CHECK ADDED (REAL-WORLD REQUIREMENT)
        // ✅ FIXED: Use entity method (DTO method cannot be converted to Policy)
        // =========================================================
        Policy activePolicy = policyService.getActivePaidPolicyEntity(policyholderId);

        // insurance type must match purchased policy
        String policyType = (activePolicy.getInsuranceType() == null) ? "" : activePolicy.getInsuranceType().trim().toUpperCase();
        String claimType  = (claim.getInsuranceType() == null) ? "" : claim.getInsuranceType().trim().toUpperCase();

        if (claimType.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insurance type is required");
        }

        if (!policyType.equals(claimType)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Insurance type does not match your active policy. Please select the correct insurance type."
            );
        }

        // policyNumber: if not provided, auto-fill from active policy
        if (claim.getPolicyNumber() == null || claim.getPolicyNumber().trim().isEmpty()) {
            claim.setPolicyNumber(activePolicy.getPolicyNumber());
        } else {
            // If user entered, verify it matches the active policy
            if (!claim.getPolicyNumber().trim().equalsIgnoreCase(activePolicy.getPolicyNumber())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Policy number does not match your active policy."
                );
            }
        }

        // Accept both:
        //  - #12345678
        //  - POL-20260408-834921
        String pn = claim.getPolicyNumber().trim();
        boolean okPn = pn.matches("^#\\d+$") || pn.matches("^POL-\\d{8}-\\d{6}$");

        if (!okPn) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid policy number format. Use #12345678 or POL-YYYYMMDD-XXXXXX"
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

        // OPTIONAL: If you later add Claim.policy relation, set it here:
        // claim.setPolicy(activePolicy);

        return claimRepository.save(claim);
    }

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

        if (claim.getInvestigation() != null && isCompletedStatus(claim.getInvestigation().getStatus())) {
            claim.setStatus("UNDER_REVIEW");
        }

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

    public List<Claim> getUnassignedSubmittedClaims() {
        return claimRepository.findByAdjusterIsNullAndStatus("SUBMITTED");
    }

    public List<Claim> getAssignableClaimsForAdjuster() {
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

        if (status == null || (!"APPROVED".equalsIgnoreCase(status) && !"REJECTED".equalsIgnoreCase(status))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status");
        }

        claim.setStatus(status.toUpperCase());
        return claimRepository.save(claim);
    }

    public Claim moveClaimToUnderwriterReview(Long claimId) {
        if (claimId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid claimId");
        }

        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found"));

        if (claim.getInvestigation() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Investigation not found for claim");
        }

        if (!isCompletedStatus(claim.getInvestigation().getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Investigation not completed yet");
        }

        claim.setStatus("UNDER_REVIEW");
        return claimRepository.save(claim);
    }

    public List<UnderwriterClaimDTO> getUnderwriterClaimsWithReport(Long underwriterId) {
        if (underwriterId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid request");
        }

        List<Claim> claims = claimRepository.findClaimsWithInvestigation(underwriterId);
        List<UnderwriterClaimDTO> result = new ArrayList<>();

        for (Claim c : claims) {
            String invStatus = null;
            String invReport = null;

            if (c.getInvestigation() != null) {
                invStatus = c.getInvestigation().getStatus();
                invReport = c.getInvestigation().getReport();
            }

            UnderwriterClaimDTO dto = new UnderwriterClaimDTO(
                    c.getId(),
                    c.getInsuranceType(),
                    c.getPolicyNumber(),
                    c.getDescription(),
                    c.getDate(),
                    c.getStatus(),
                    invStatus,
                    invReport
            );

            result.add(dto);
        }

        return result;
    }

    public List<PolicyholderClaimTrackingDTO> getPolicyholderClaimsTracking(Long policyholderId) {
        if (policyholderId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid request");
        }

        List<Claim> claims = claimRepository.findPolicyholderClaimsWithInvestigation(policyholderId);
        List<PolicyholderClaimTrackingDTO> result = new ArrayList<>();

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

    private boolean isCompletedStatus(String status) {
        if (status == null) return false;
        String st = status.trim().toUpperCase();
        return st.equals("COMPLETED") || st.contains("COMPLETED");
    }
}