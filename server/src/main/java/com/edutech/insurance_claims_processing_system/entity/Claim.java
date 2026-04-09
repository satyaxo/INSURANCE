package com.edutech.insurance_claims_processing_system.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;

import javax.persistence.*;
import java.util.Date;

@Entity
@Table(name = "claims")
public class Claim {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ✅ insurance type (CAR / BIKE / LIFE / HEALTH / etc.)
    @Column(nullable = false)
    private String insuranceType;

    // ✅ policy number (keep for quick lookup + UI)
    @Column(nullable = false)
    private String policyNumber;

    private String description;

    @Temporal(TemporalType.DATE)
    private Date date;

    private String status;

    // ✅ NEW (Enterprise): Claim belongs to a purchased policy
    // Keep nullable=true for now to avoid breaking old DB rows.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "policy_id")
    @NotFound(action = NotFoundAction.IGNORE)
    @JsonIgnore
    private Policy policy;

    @ManyToOne
    @JoinColumn(name = "policyholder_id")
    @NotFound(action = NotFoundAction.IGNORE)
    private Policyholder policyholder;

    @ManyToOne
    @JoinColumn(name = "adjuster_id")
    @NotFound(action = NotFoundAction.IGNORE)
    private Adjuster adjuster;

    @ManyToOne
    @JoinColumn(name = "underwriter_id")
    @NotFound(action = NotFoundAction.IGNORE)
    private Underwriter underwriter;

    @ManyToOne
    @JoinColumn(name = "investigator_id")
    @NotFound(action = NotFoundAction.IGNORE)
    private Investigator investigator;

    @OneToOne(mappedBy = "claim")
    @JsonIgnore
    private Investigation investigation;

    // -------------------- Getters & Setters --------------------

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getInsuranceType() {
        return insuranceType;
    }

    public void setInsuranceType(String insuranceType) {
        this.insuranceType = insuranceType;
    }

    public String getPolicyNumber() {
        return policyNumber;
    }

    public void setPolicyNumber(String policyNumber) {
        this.policyNumber = policyNumber;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Date getDate() {
        return date;
    }

    public void setDate(Date date) {
        this.date = date;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Policy getPolicy() {
        return policy;
    }

    public void setPolicy(Policy policy) {
        this.policy = policy;
    }

    public Policyholder getPolicyholder() {
        return policyholder;
    }

    public void setPolicyholder(Policyholder policyholder) {
        this.policyholder = policyholder;
    }

    public Adjuster getAdjuster() {
        return adjuster;
    }

    public void setAdjuster(Adjuster adjuster) {
        this.adjuster = adjuster;
    }

    public Underwriter getUnderwriter() {
        return underwriter;
    }

    public void setUnderwriter(Underwriter underwriter) {
        this.underwriter = underwriter;
    }

    public Investigator getInvestigator() {
        return investigator;
    }

    public void setInvestigator(Investigator investigator) {
        this.investigator = investigator;
    }

    public Investigation getInvestigation() {
        return investigation;
    }

    public void setInvestigation(Investigation investigation) {
        this.investigation = investigation;
    }
}