package com.edutech.insurance_claims_processing_system.entity;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(
    name = "policies",
    indexes = {
        @Index(name = "idx_policy_number", columnList = "policyNumber", unique = true),
        @Index(name = "idx_policyholder_status", columnList = "policyholder_id, policyStatus")
    }
)
public class Policy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ✅ Unique policy number like "POL-2026-0000123"
    @Column(nullable = false, unique = true, length = 32)
    private String policyNumber;

    // ✅ Link to policyholder (User table)
    // ✅ JsonIgnore prevents Hibernate proxy serialization error
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "policyholder_id", nullable = false)
    @JsonIgnore
    private User policyholder;

    // ✅ CAR / BIKE / HEALTH / LIFE / TERM / TRAVEL / HOME
    @Column(nullable = false, length = 20)
    private String insuranceType;

    // ✅ BASIC / STANDARD / PREMIUM
    @Column(nullable = false, length = 20)
    private String planType;

    // ✅ Coverage amount
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal coverageAmount;

    // ✅ Premium amount (annual)
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal premiumAmount;

    // ✅ Policy validity dates
    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    // ✅ ACTIVE / EXPIRED / CANCELLED
    @Column(nullable = false, length = 20)
    private String policyStatus = "ACTIVE";

    // ✅ PENDING / PAID / FAILED
    @Column(nullable = false, length = 20)
    private String paymentStatus = "PENDING";

    // ✅ Razorpay references
    @Column(length = 100)
    private String razorpayOrderId;

    @Column(length = 100)
    private String razorpayPaymentId;

    @Column(length = 150)
    private String razorpaySignature;

    // ✅ Audit
    @Column(nullable = false)
    private LocalDate createdDate = LocalDate.now();

    // -------------------------
    // Constructors
    // -------------------------
    public Policy() {}

    // -------------------------
    // Getters & Setters
    // -------------------------
    public Long getId() {
        return id;
    }

    public String getPolicyNumber() {
        return policyNumber;
    }

    public void setPolicyNumber(String policyNumber) {
        this.policyNumber = policyNumber;
    }

    public User getPolicyholder() {
        return policyholder;
    }

    public void setPolicyholder(User policyholder) {
        this.policyholder = policyholder;
    }

    public String getInsuranceType() {
        return insuranceType;
    }

    public void setInsuranceType(String insuranceType) {
        this.insuranceType = insuranceType;
    }

    public String getPlanType() {
        return planType;
    }

    public void setPlanType(String planType) {
        this.planType = planType;
    }

    public BigDecimal getCoverageAmount() {
        return coverageAmount;
    }

    public void setCoverageAmount(BigDecimal coverageAmount) {
        this.coverageAmount = coverageAmount;
    }

    public BigDecimal getPremiumAmount() {
        return premiumAmount;
    }

    public void setPremiumAmount(BigDecimal premiumAmount) {
        this.premiumAmount = premiumAmount;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
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

    public LocalDate getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(LocalDate createdDate) {
        this.createdDate = createdDate;
    }
}