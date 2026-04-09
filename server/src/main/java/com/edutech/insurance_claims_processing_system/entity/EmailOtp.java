package com.edutech.insurance_claims_processing_system.entity;

import javax.persistence.*;
import java.util.Date;

@Entity
@Table(
        name = "email_otps",
        indexes = {
                @Index(name = "idx_email_otps_email", columnList = "email"),
                @Index(name = "idx_email_otps_expires_at", columnList = "expiresAt")
        }
)
public class EmailOtp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Email to verify
    @Column(nullable = false, length = 150)
    private String email;

    // Store OTP as HASH (never store plain OTP)
    @Column(nullable = false, length = 255)
    private String otpHash;

    // Expiry time (e.g., now + 5 minutes)
    @Temporal(TemporalType.TIMESTAMP)
    @Column(nullable = false)
    private Date expiresAt;

    // Mark true after successful verification
    @Column(nullable = false)
    private boolean verified = false;

    // Attempts to prevent brute-force (e.g., max 5)
    @Column(nullable = false)
    private int attempts = 0;

    // Track resend throttling (e.g., 30 seconds gap)
    @Temporal(TemporalType.TIMESTAMP)
    private Date lastSentAt;

    // When OTP record created
    @Temporal(TemporalType.TIMESTAMP)
    @Column(nullable = false)
    private Date createdAt;

    // Optional: when verified
    @Temporal(TemporalType.TIMESTAMP)
    private Date verifiedAt;

    public EmailOtp() {}

    @PrePersist
    public void onCreate() {
        this.createdAt = new Date();
    }

    // -------------- Getters / Setters ----------------

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getOtpHash() {
        return otpHash;
    }

    public void setOtpHash(String otpHash) {
        this.otpHash = otpHash;
    }

    public Date getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Date expiresAt) {
        this.expiresAt = expiresAt;
    }

    public boolean isVerified() {
        return verified;
    }

    public void setVerified(boolean verified) {
        this.verified = verified;
    }

    public int getAttempts() {
        return attempts;
    }

    public void setAttempts(int attempts) {
        this.attempts = attempts;
    }

    public Date getLastSentAt() {
        return lastSentAt;
    }

    public void setLastSentAt(Date lastSentAt) {
        this.lastSentAt = lastSentAt;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public Date getVerifiedAt() {
        return verifiedAt;
    }

    public void setVerifiedAt(Date verifiedAt) {
        this.verifiedAt = verifiedAt;
    }
}