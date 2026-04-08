package com.edutech.insurance_claims_processing_system.service;

import com.edutech.insurance_claims_processing_system.dto.PolicyResponseDTO;
import com.edutech.insurance_claims_processing_system.entity.Policy;
import com.edutech.insurance_claims_processing_system.entity.User;
import com.edutech.insurance_claims_processing_system.repository.PolicyRepository;

import javax.persistence.EntityManager;
import javax.transaction.Transactional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PolicyService {

    private final PolicyRepository policyRepository;
    private final EntityManager entityManager;

    public PolicyService(PolicyRepository policyRepository, EntityManager entityManager) {
        this.policyRepository = policyRepository;
        this.entityManager = entityManager;
    }

    /* =========================================================
       ✅ 1) Create Policy Purchase (Before Payment)
       ========================================================= */
    @Transactional
    public Policy createPolicyPurchase(
            Long policyholderId,
            String insuranceType,
            String planType,
            BigDecimal coverageAmount,
            BigDecimal premiumAmount,
            Integer durationYears,
            String razorpayOrderId
    ) {
        if (policyholderId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Policyholder id is required");
        }
        if (insuranceType == null || insuranceType.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insurance type is required");
        }
        if (planType == null || planType.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Plan type is required");
        }
        if (coverageAmount == null || coverageAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Coverage amount must be positive");
        }
        if (premiumAmount == null || premiumAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Premium amount must be positive");
        }
        if (durationYears == null || durationYears <= 0) {
            durationYears = 1;
        }

        User policyholderRef = entityManager.getReference(User.class, policyholderId);

        Policy policy = new Policy();
        policy.setPolicyholder(policyholderRef);
        policy.setInsuranceType(insuranceType.trim().toUpperCase());
        policy.setPlanType(planType.trim().toUpperCase());
        policy.setCoverageAmount(coverageAmount);
        policy.setPremiumAmount(premiumAmount);

        LocalDate start = LocalDate.now();
        LocalDate end = start.plusYears(durationYears);

        policy.setStartDate(start);
        policy.setEndDate(end);
        policy.setPolicyStatus("PENDING");
        policy.setPaymentStatus("PENDING");

        if (razorpayOrderId != null && !razorpayOrderId.trim().isEmpty()) {
            policy.setRazorpayOrderId(razorpayOrderId.trim());
        }

        policy.setPolicyNumber(generatePolicyNumber());

        return policyRepository.save(policy);
    }

    /* =========================================================
       ✅ 2) Mark Payment Success + Activate Policy
       ========================================================= */
    @Transactional
    public Policy markPaymentSuccessAndActivate(
            String razorpayOrderId,
            String razorpayPaymentId,
            String razorpaySignature
    ) {
        if (razorpayOrderId == null || razorpayOrderId.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Razorpay orderId is required");
        }

        Policy policy = policyRepository.findByRazorpayOrderId(razorpayOrderId.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Policy not found for this order"));

        if ("PAID".equalsIgnoreCase(policy.getPaymentStatus())
                && "ACTIVE".equalsIgnoreCase(policy.getPolicyStatus())) {
            return policy;
        }

        policy.setPaymentStatus("PAID");
        policy.setPolicyStatus("ACTIVE");

        if (razorpayPaymentId != null) policy.setRazorpayPaymentId(razorpayPaymentId);
        if (razorpaySignature != null) policy.setRazorpaySignature(razorpaySignature);

        return policyRepository.save(policy);
    }

    /* =========================================================
       ✅ 3) Mark Payment Failed
       ========================================================= */
    @Transactional
    public Policy markPaymentFailed(String razorpayOrderId) {
        if (razorpayOrderId == null || razorpayOrderId.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Razorpay orderId is required");
        }

        Policy policy = policyRepository.findByRazorpayOrderId(razorpayOrderId.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Policy not found for this order"));

        policy.setPaymentStatus("FAILED");
        policy.setPolicyStatus("CANCELLED");

        return policyRepository.save(policy);
    }

    /* =========================================================
       ✅ 4) Get all policies for policyholder (DTO)
       ========================================================= */
    public List<PolicyResponseDTO> getPoliciesForPolicyholder(Long policyholderId) {
        if (policyholderId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Policyholder id is required");
        }

        return policyRepository.findByPolicyholder_IdOrderByIdDesc(policyholderId)
                .stream()
                .map(this::mapToPolicyDTO)
                .collect(Collectors.toList());
    }

    /* =========================================================
       ✅ 5A) Get active paid policy (DTO) -> used by Controllers
       ========================================================= */
    public PolicyResponseDTO getActivePaidPolicy(Long policyholderId) {
        Policy policy = getActivePaidPolicyEntity(policyholderId);
        return mapToPolicyDTO(policy);
    }

    /* =========================================================
       ✅ 5B) Get active paid policy (ENTITY) -> used by ClaimService
       ========================================================= */
    public Policy getActivePaidPolicyEntity(Long policyholderId) {
        return policyRepository.findActivePaidPolicy(policyholderId, LocalDate.now())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No active paid policy found"));
    }

    /* =========================================================
       ✅ 6) Validation helper: must have active paid policy
       ========================================================= */
    public void validateActivePolicyOrThrow(Long policyholderId) {
        boolean ok = policyRepository.existsActivePaidPolicy(policyholderId, LocalDate.now());
        if (!ok) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Active policy not found. Please purchase a policy before creating a claim."
            );
        }
    }

    /* =========================================================
       ✅ Entity -> DTO mapper
       ========================================================= */
    private PolicyResponseDTO mapToPolicyDTO(Policy policy) {
        PolicyResponseDTO dto = new PolicyResponseDTO();
        dto.setId(policy.getId());
        dto.setPolicyNumber(policy.getPolicyNumber());
        dto.setInsuranceType(policy.getInsuranceType());
        dto.setPlanType(policy.getPlanType());
        dto.setPolicyStatus(policy.getPolicyStatus());
        dto.setPaymentStatus(policy.getPaymentStatus());
        dto.setStartDate(policy.getStartDate());
        dto.setEndDate(policy.getEndDate());
        dto.setCoverageAmount(policy.getCoverageAmount() != null ? policy.getCoverageAmount().doubleValue() : 0.0);
        dto.setPremiumAmount(policy.getPremiumAmount() != null ? policy.getPremiumAmount().doubleValue() : 0.0);
        return dto;
    }

    private String generatePolicyNumber() {
        String date = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        int rand = (int) (Math.random() * 900000) + 100000;
        return "POL-" + date + "-" + rand;
    }
}