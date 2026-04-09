package com.edutech.insurance_claims_processing_system.dto;

import java.util.Date;

public class UnderwriterClaimDTO {

    private Long id;
    private String insuranceType;
    private String policyNumber;
    private String description;
    private Date date;
    private String status;

    private String investigationStatus;
    private String investigationReport;

    public UnderwriterClaimDTO() {}

    public UnderwriterClaimDTO(Long id,
                               String insuranceType,
                               String policyNumber,
                               String description,
                               Date date,
                               String status,
                               String investigationStatus,
                               String investigationReport) {
        this.id = id;
        this.insuranceType = insuranceType;
        this.policyNumber = policyNumber;
        this.description = description;
        this.date = date;
        this.status = status;
        this.investigationStatus = investigationStatus;
        this.investigationReport = investigationReport;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getInsuranceType() { return insuranceType; }
    public void setInsuranceType(String insuranceType) { this.insuranceType = insuranceType; }

    public String getPolicyNumber() { return policyNumber; }
    public void setPolicyNumber(String policyNumber) { this.policyNumber = policyNumber; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Date getDate() { return date; }
    public void setDate(Date date) { this.date = date; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getInvestigationStatus() { return investigationStatus; }
    public void setInvestigationStatus(String investigationStatus) { this.investigationStatus = investigationStatus; }

    public String getInvestigationReport() { return investigationReport; }
    public void setInvestigationReport(String investigationReport) { this.investigationReport = investigationReport; }
}