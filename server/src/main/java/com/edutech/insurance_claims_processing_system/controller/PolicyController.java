package com.edutech.insurance_claims_processing_system.controller;

import com.edutech.insurance_claims_processing_system.dto.PolicyResponseDTO;
import com.edutech.insurance_claims_processing_system.entity.Policy;
import com.edutech.insurance_claims_processing_system.service.PolicyService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/policy")
@CrossOrigin(origins = "*")
public class PolicyController {

    private final PolicyService policyService;

    public PolicyController(PolicyService policyService) {
        this.policyService = policyService;
    }

    /* =========================================================
       ✅ 1) Create Policy Purchase (Before Payment)
       NOTE: Returns Policy entity (OK for now)
       ========================================================= */
    @PostMapping("/purchase")
    public ResponseEntity<Policy> createPolicyPurchase(
            @RequestParam Long policyholderId,
            @RequestBody PolicyPurchaseRequest request
    ) {
        Policy created = policyService.createPolicyPurchase(
                policyholderId,
                request.getInsuranceType(),
                request.getPlanType(),
                request.getCoverageAmount(),
                request.getPremiumAmount(),
                request.getDurationYears(),
                request.getRazorpayOrderId()
        );

        return ResponseEntity.ok(created);
    }

    /* =========================================================
       ✅ 2) Payment Success → Activate Policy
       NOTE: Returns Policy entity (OK for now)
       ========================================================= */
    @PostMapping("/payment/success")
    public ResponseEntity<Policy> markPaymentSuccess(@RequestBody PaymentSuccessRequest request) {
        Policy activated = policyService.markPaymentSuccessAndActivate(
                request.getRazorpayOrderId(),
                request.getRazorpayPaymentId(),
                request.getRazorpaySignature()
        );

        return ResponseEntity.ok(activated);
    }

    /* =========================================================
       ✅ 3) Payment Failed → Cancel policy (optional)
       NOTE: Returns Policy entity (OK for now)
       ========================================================= */
    @PostMapping("/payment/failed")
    public ResponseEntity<Policy> markPaymentFailed(@RequestBody PaymentFailedRequest request) {
        Policy failed = policyService.markPaymentFailed(request.getRazorpayOrderId());
        return ResponseEntity.ok(failed);
    }

    /* =========================================================
       ✅ 4) Get all policies for policyholder (DTO LIST)
       ========================================================= */
    @GetMapping("/my")
    public ResponseEntity<List<PolicyResponseDTO>> getMyPolicies(@RequestParam Long policyholderId) {
        List<PolicyResponseDTO> list = policyService.getPoliciesForPolicyholder(policyholderId);
        return ResponseEntity.ok(list);
    }

    /* =========================================================
       ✅ 5) Get active paid policy for policyholder (DTO)
       ========================================================= */
    @GetMapping("/active")
    public ResponseEntity<PolicyResponseDTO> getActivePolicy(@RequestParam Long policyholderId) {
        PolicyResponseDTO policy = policyService.getActivePaidPolicy(policyholderId);
        return ResponseEntity.ok(policy);
    }

    /* =========================================================
       ✅ DTOs (Request Bodies)
       ========================================================= */
    public static class PolicyPurchaseRequest {
        private String insuranceType;
        private String planType;
        private BigDecimal coverageAmount;
        private BigDecimal premiumAmount;
        private Integer durationYears;
        private String razorpayOrderId;

        public String getInsuranceType() { return insuranceType; }
        public void setInsuranceType(String insuranceType) { this.insuranceType = insuranceType; }

        public String getPlanType() { return planType; }
        public void setPlanType(String planType) { this.planType = planType; }

        public BigDecimal getCoverageAmount() { return coverageAmount; }
        public void setCoverageAmount(BigDecimal coverageAmount) { this.coverageAmount = coverageAmount; }

        public BigDecimal getPremiumAmount() { return premiumAmount; }
        public void setPremiumAmount(BigDecimal premiumAmount) { this.premiumAmount = premiumAmount; }

        public Integer getDurationYears() { return durationYears; }
        public void setDurationYears(Integer durationYears) { this.durationYears = durationYears; }

        public String getRazorpayOrderId() { return razorpayOrderId; }
        public void setRazorpayOrderId(String razorpayOrderId) { this.razorpayOrderId = razorpayOrderId; }
    }

    public static class PaymentSuccessRequest {
        private String razorpayOrderId;
        private String razorpayPaymentId;
        private String razorpaySignature;

        public String getRazorpayOrderId() { return razorpayOrderId; }
        public void setRazorpayOrderId(String razorpayOrderId) { this.razorpayOrderId = razorpayOrderId; }

        public String getRazorpayPaymentId() { return razorpayPaymentId; }
        public void setRazorpayPaymentId(String razorpayPaymentId) { this.razorpayPaymentId = razorpayPaymentId; }

        public String getRazorpaySignature() { return razorpaySignature; }
        public void setRazorpaySignature(String razorpaySignature) { this.razorpaySignature = razorpaySignature; }
    }

    public static class PaymentFailedRequest {
        private String razorpayOrderId;

        public String getRazorpayOrderId() { return razorpayOrderId; }
        public void setRazorpayOrderId(String razorpayOrderId) { this.razorpayOrderId = razorpayOrderId; }
    }
}