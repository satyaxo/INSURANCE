package com.edutech.insurance_claims_processing_system.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.edutech.insurance_claims_processing_system.service.EmailOtpService;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "*")
public class EmailOtpController {

    private final EmailOtpService emailOtpService;

    public EmailOtpController(EmailOtpService emailOtpService) {
        this.emailOtpService = emailOtpService;
    }

    /**
     * ✅ Send OTP to Email
     * POST /api/user/send-otp
     * Body: { "email": "abc@gmail.com" }
     *
     * - If otp.demo.mode=true => returns OTP in response (testing)
     * - If otp.demo.mode=false => sends email and returns only message
     */
    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody SendOtpRequest request) {

        if (request == null || request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new ApiMessage("Email is required"));
        }

        String otp = emailOtpService.sendOtp(request.getEmail());

        // Real email mode => otp will be null
        if (otp == null) {
            return ResponseEntity.ok(new ApiMessage("OTP sent to email successfully"));
        }

        // Demo mode => otp returned for testing
        return ResponseEntity.ok(new OtpDemoResponse("OTP generated (demo mode)", otp));
    }

    /**
     * ✅ Verify OTP
     * POST /api/user/verify-otp
     * Body: { "email": "abc@gmail.com", "otp": "123456" }
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody VerifyOtpRequest request) {

        if (request == null
                || request.getEmail() == null || request.getEmail().trim().isEmpty()
                || request.getOtp() == null || request.getOtp().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new ApiMessage("Email and OTP are required"));
        }

        emailOtpService.verifyOtp(request.getEmail(), request.getOtp());
        return ResponseEntity.ok(new ApiMessage("Email verified successfully"));
    }

    // -------------------- Request/Response DTOs --------------------

    public static class SendOtpRequest {
        private String email;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
    }

    public static class VerifyOtpRequest {
        private String email;
        private String otp;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getOtp() { return otp; }
        public void setOtp(String otp) { this.otp = otp; }
    }

    public static class ApiMessage {
        private String message;

        public ApiMessage() {}
        public ApiMessage(String message) { this.message = message; }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }

    public static class OtpDemoResponse {
        private String message;
        private String otp;

        public OtpDemoResponse() {}
        public OtpDemoResponse(String message, String otp) {
            this.message = message;
            this.otp = otp;
        }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }

        public String getOtp() { return otp; }
        public void setOtp(String otp) { this.otp = otp; }
    }
}