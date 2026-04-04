package com.edutech.insurance_claims_processing_system.service;

import java.io.IOException;
import java.nio.file.*;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.edutech.insurance_claims_processing_system.entity.Claim;
import com.edutech.insurance_claims_processing_system.entity.ClaimDocument;

@Service
public class ClaimDocumentStorageService {

    // ✅ Set this in application.properties:
    // file.upload.base-path=/home/coder/app/server/uploads
    // If not set, it defaults to "uploads"
    @Value("${file.upload.base-path:uploads}")
    private String basePath;

    // ✅ allowed file types
    private static final List<String> ALLOWED_TYPES = Arrays.asList(
            "image/jpeg", "image/png", "application/pdf"
    );

    // ✅ 5MB max per file
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;

    /**
     * Stores the file on disk and returns a ClaimDocument object (NOT saved to DB here).
     */
    public ClaimDocument storeFile(MultipartFile file, Claim claim) {

        if (claim == null || claim.getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Claim is required");
        }

        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is required");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File too large (max 5MB)");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only JPG, PNG, or PDF files allowed");
        }

        String originalName = file.getOriginalFilename();
        if (originalName == null || originalName.trim().isEmpty()) {
            originalName = "file";
        }

        String extension = getFileExtension(originalName);
        String storedFileName = UUID.randomUUID().toString() + extension;

        try {
            // ✅ Folder: {basePath}/claims/{claimId}/documents
            Path claimDir = Paths.get(basePath, "claims", claim.getId().toString(), "documents");
            Files.createDirectories(claimDir);

            Path filePath = claimDir.resolve(storedFileName);

            // ✅ Save file on disk
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // ✅ Build metadata object (DB save happens in ClaimDocumentService)
            ClaimDocument doc = new ClaimDocument();
            doc.setClaim(claim);
            doc.setOriginalFileName(originalName);
            doc.setStoredFileName(storedFileName);
            doc.setContentType(contentType);
            doc.setSize(file.getSize());
            doc.setFilePath(filePath.toString());
            doc.setUploadedAt(new Date());

            return doc;

        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store file");
        }
    }

    private String getFileExtension(String fileName) {
        return (fileName != null && fileName.contains("."))
                ? fileName.substring(fileName.lastIndexOf("."))
                : "";
    }
}