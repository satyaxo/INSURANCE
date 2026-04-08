package com.edutech.insurance_claims_processing_system.controller;

import com.edutech.insurance_claims_processing_system.entity.Policy;
import com.edutech.insurance_claims_processing_system.service.PaymentService;
import com.edutech.insurance_claims_processing_system.service.PolicyService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin(origins = "*")
public class PaymentController {

    private final PaymentService paymentService;
    private final PolicyService policyService;

    public PaymentController(PaymentService paymentService, PolicyService policyService) {
        this.paymentService = paymentService;
        this.policyService = policyService;
    }

    /* =========================================================
       ✅ 1) Create Razorpay Order
       Frontend sends amount in paise.
       Example: ₹499 => 49900
       Returns: orderId + keyId + amount + currency
       ========================================================= */
    @PostMapping("/create-order")
    public ResponseEntity<Map<String, Object>> createOrder(@RequestBody CreateOrderRequest request) {

        if (request == null || request.getAmountInPaise() == null || request.getAmountInPaise() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "amountInPaise must be > 0");
        }

        Map<String, Object> orderData = paymentService.createOrder(
                request.getAmountInPaise(),
                request.getCurrency(),
                request.getReceipt()
        );

        return ResponseEntity.ok(orderData);
    }

    /* =========================================================
       ✅ 2) Verify Payment
       Razorpay sends: orderId, paymentId, signature
       Backend verifies signature using keySecret.
       If valid -> Activate policy (PAID + ACTIVE)
       ========================================================= */
    @PostMapping("/verify")
    public ResponseEntity<VerifyPaymentResponse> verifyPayment(@RequestBody VerifyPaymentRequest request) {

        if (request == null
                || isBlank(request.getRazorpayOrderId())
                || isBlank(request.getRazorpayPaymentId())
                || isBlank(request.getRazorpaySignature())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "orderId/paymentId/signature required");
        }

        boolean ok = paymentService.verifySignature(
                request.getRazorpayOrderId(),
                request.getRazorpayPaymentId(),
                request.getRazorpaySignature()
        );

        if (!ok) {
            // ✅ Security: never activate policy if signature mismatch
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment verification failed (signature mismatch)");
        }

        // ✅ Activate the policy linked with this orderId
        Policy activated = policyService.markPaymentSuccessAndActivate(
                request.getRazorpayOrderId(),
                request.getRazorpayPaymentId(),
                request.getRazorpaySignature()
        );

        VerifyPaymentResponse response = new VerifyPaymentResponse();
        response.setMessage("Payment verified and policy activated");
        response.setPolicyId(activated.getId());
        response.setPolicyNumber(activated.getPolicyNumber());
        response.setPolicyStatus(activated.getPolicyStatus());
        response.setPaymentStatus(activated.getPaymentStatus());

        return ResponseEntity.ok(response);
    }

    // -----------------------
    // Small helper
    // -----------------------
    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    /* =========================================================
       ✅ Request/Response DTOs (kept inside controller to avoid new files)
       ========================================================= */

    public static class CreateOrderRequest {
        private Long amountInPaise;
        private String currency;   // default "INR"
        private String receipt;    // optional (for your reference)

        public Long getAmountInPaise() {
            return amountInPaise;
        }

        public void setAmountInPaise(Long amountInPaise) {
            this.amountInPaise = amountInPaise;
        }

        public String getCurrency() {
            return currency;
        }

        public void setCurrency(String currency) {
            this.currency = currency;
        }

        public String getReceipt() {
            return receipt;
        }

        public void setReceipt(String receipt) {
            this.receipt = receipt;
        }
    }

    public static class VerifyPaymentRequest {
        private String razorpayOrderId;
        private String razorpayPaymentId;
        private String razorpaySignature;

        public String getRazorpayOrderId() {
            return razorpayOrderId;
        }

        public void setRazorpayOrderId(String razorpayOrderId) {
            this.razorpayOrderId = razorpayOrderId;
        }

        public String getRazorpayPaymentId() {
            return razorpayPaymentId;
        }

        public void setRazorpayPaymentId(String razorpayPaymentId) {
            this.razorpayPaymentId = razorpayPaymentId;
        }

        public String getRazorpaySignature() {
            return razorpaySignature;
        }

        public void setRazorpaySignature(String razorpaySignature) {
            this.razorpaySignature = razorpaySignature;
        }
    }

    public static class VerifyPaymentResponse {
        private String message;
        private Long policyId;
        private String policyNumber;
        private String policyStatus;
        private String paymentStatus;

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public Long getPolicyId() {
            return policyId;
        }

        public void setPolicyId(Long policyId) {
            this.policyId = policyId;
        }

        public String getPolicyNumber() {
            return policyNumber;
        }

        public void setPolicyNumber(String policyNumber) {
            this.policyNumber = policyNumber;
        }

        public String getPolicyStatus() {
            return policyStatus;
        }

        public void setPolicyStatus(String policyStatus) {
            this.policyStatus = policyStatus;
        }

        public String getPaymentStatus() {
            return paymentStatus;
        }

        public void setPaymentStatus(String paymentStatus) {
            this.paymentStatus = paymentStatus;
        }
    }
}