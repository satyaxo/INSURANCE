package com.edutech.insurance_claims_processing_system.entity;

import javax.persistence.*;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "investigations")
public class Investigation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 1000)
    private String report;

    private String status;

    @OneToOne
    @JoinColumn(name = "claim_id", nullable = false, unique = true) // ✅ IMPORTANT
    @JsonIgnoreProperties({"investigation","policyholder","adjuster","underwriter","investigator"})
    private Claim claim;

    // -------------------- Constructors --------------------
    public Investigation() {}

    public Investigation(String report, String status) {
        this.report = report;
        this.status = status;
    }

    // -------------------- Getters and Setters --------------------
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getReport() { return report; }
    public void setReport(String report) { this.report = report; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Claim getClaim() { return claim; }
    public void setClaim(Claim claim) { this.claim = claim; }
}
