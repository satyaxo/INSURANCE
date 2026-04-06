package com.edutech.insurance_claims_processing_system.service;

import java.security.SecureRandom;
import java.util.Date;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;   // ✅ NEW
import org.springframework.web.server.ResponseStatusException;

import com.edutech.insurance_claims_processing_system.entity.EmailOtp;
import com.edutech.insurance_claims_processing_system.repository.EmailOtpRepository;

@Service
public class EmailOtpService {

    private final EmailOtpRepository emailOtpRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${otp.expiry.minutes:5}")
    private int otpExpiryMinutes;

    @Value("${otp.resend.cooldown.seconds:30}")
    private int resendCooldownSeconds;

    @Value("${otp.max.attempts:5}")
    private int maxAttempts;

    @Value("${otp.demo.mode:true}")
    private boolean demoMode;

    public EmailOtpService(EmailOtpRepository emailOtpRepository,
                           PasswordEncoder passwordEncoder,
                           EmailService emailService) {
        this.emailOtpRepository = emailOtpRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    /**
     * ✅ Send OTP:
     * - stores OTP hash in DB
     * - enforces resend cooldown
     * - deletes old OTP rows safely (transaction required)
     * - real mode sends email
     */
    @Transactional  // ✅ FIX: ensures delete/save run inside transaction
    public String sendOtp(String email) {

        String normalizedEmail = normalizeEmail(email);
        if (normalizedEmail == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }

        if (emailOtpRepository.existsByEmailAndVerifiedTrue(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already verified");
        }

        Optional<EmailOtp> lastOpt = emailOtpRepository.findTopByEmailOrderByIdDesc(normalizedEmail);
        if (lastOpt.isPresent()) {
            EmailOtp last = lastOpt.get();

            if (last.getLastSentAt() != null) {
                long secondsSinceLast = (System.currentTimeMillis() - last.getLastSentAt().getTime()) / 1000L;
                if (secondsSinceLast < resendCooldownSeconds) {
                    throw new ResponseStatusException(
                            HttpStatus.TOO_MANY_REQUESTS,
                            "Please wait " + (resendCooldownSeconds - secondsSinceLast) + " seconds before resending OTP"
                    );
                }
            }
        }

        String otp = generateSixDigitOtp();
        Date expiresAt = new Date(System.currentTimeMillis() + otpExpiryMinutes * 60L * 1000L);

        // ✅ This delete requires transaction → now safe due to @Transactional
        emailOtpRepository.deleteByEmail(normalizedEmail);

        EmailOtp record = new EmailOtp();
        record.setEmail(normalizedEmail);
        record.setOtpHash(passwordEncoder.encode(otp));
        record.setExpiresAt(expiresAt);
        record.setVerified(false);
        record.setAttempts(0);
        record.setLastSentAt(new Date());

        emailOtpRepository.save(record);

        // ✅ Real email mode
        if (!demoMode) {
            emailService.sendOtpEmail(normalizedEmail, otp, otpExpiryMinutes);
            return null;
        }

        // ✅ Demo mode
        return otp;
    }

    /**
     * ✅ Verify OTP:
     * - updates attempts/verified -> needs transaction too
     */
    @Transactional  // ✅ recommended (updates record)
    public void verifyOtp(String email, String otp) {

        String normalizedEmail = normalizeEmail(email);
        if (normalizedEmail == null || otp == null || otp.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email and OTP are required");
        }

        EmailOtp record = emailOtpRepository.findTopByEmailOrderByIdDesc(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "OTP not found. Please request OTP again"));

        if (record.isVerified()) {
            return;
        }

        if (record.getExpiresAt() != null && record.getExpiresAt().before(new Date())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP expired. Please request a new OTP");
        }

        if (record.getAttempts() >= maxAttempts) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Too many invalid attempts. Please resend OTP");
        }

        boolean matched = passwordEncoder.matches(otp.trim(), record.getOtpHash());

        if (!matched) {
            record.setAttempts(record.getAttempts() + 1);
            emailOtpRepository.save(record);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid OTP");
        }

        record.setVerified(true);
        record.setVerifiedAt(new Date());
        emailOtpRepository.save(record);
    }

    public boolean isEmailVerified(String email) {
        String normalizedEmail = normalizeEmail(email);
        if (normalizedEmail == null) return false;
        return emailOtpRepository.existsByEmailAndVerifiedTrue(normalizedEmail);
    }

    public void requireEmailVerified(String email) {
        if (!isEmailVerified(email)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Email not verified. Please verify OTP first");
        }
    }

    private String normalizeEmail(String email) {
        if (email == null) return null;
        String e = email.trim().toLowerCase();
        return e.isEmpty() ? null : e;
    }

    private String generateSixDigitOtp() {
        int number = 100000 + secureRandom.nextInt(900000);
        return String.valueOf(number);
    }
}