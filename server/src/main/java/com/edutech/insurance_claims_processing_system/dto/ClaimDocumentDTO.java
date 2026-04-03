package com.edutech.insurance_claims_processing_system.dto;

public class ClaimDocumentDTO {

    private Long id;
    private String fileName;
    private String fileUrl;

    public ClaimDocumentDTO(Long id, String fileName, String fileUrl) {
        this.id = id;
        this.fileName = fileName;
        this.fileUrl = fileUrl;  // ✅ IMPORTANT semicolon
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFileUrl() {
        return fileUrl;
    }

    public void setFileUrl(String fileUrl) {
        this.fileUrl = fileUrl;
    }
}