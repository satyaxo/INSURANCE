package com.edutech.insurance_claims_processing_system.dto;

public class UnderwriterClaimDTO {
    private Long id;
    private String description;
    private String status;

    private String investigationReport;
    private String investigationStatus;

    public UnderwriterClaimDTO() {}

    public UnderwriterClaimDTO(Long id, String description, String status,
                               String investigationReport, String investigationStatus) {
        this.id = id;
        this.description = description;
        this.status = status;
        this.investigationReport = investigationReport;
        this.investigationStatus = investigationStatus;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getInvestigationReport() { return investigationReport; }
    public void setInvestigationReport(String investigationReport) { this.investigationReport = investigationReport; }

    public String getInvestigationStatus() { return investigationStatus; }
    public void setInvestigationStatus(String investigationStatus) { this.investigationStatus = investigationStatus; }
}