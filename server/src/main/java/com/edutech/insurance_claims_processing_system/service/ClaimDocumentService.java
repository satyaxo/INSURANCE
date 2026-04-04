package com.edutech.insurance_claims_processing_system.service;

import java.io.File;
import java.util.List;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.edutech.insurance_claims_processing_system.entity.Claim;
import com.edutech.insurance_claims_processing_system.entity.ClaimDocument;
import com.edutech.insurance_claims_processing_system.repository.ClaimDocumentRepository;
import com.edutech.insurance_claims_processing_system.repository.ClaimRepository;

@Service
public class ClaimDocumentService {

    private final ClaimDocumentRepository documentRepository;
    private final ClaimRepository claimRepository;
    private final ClaimDocumentStorageService storageService;

    public ClaimDocumentService(ClaimDocumentRepository documentRepository,
                                ClaimRepository claimRepository,
                                ClaimDocumentStorageService storageService) {
        this.documentRepository = documentRepository;
        this.claimRepository = claimRepository;
        this.storageService = storageService;
    }

    /**
     * Upload ONE file for a claim:
     * 1) validate claim exists
     * 2) store file on disk via storageService
     * 3) save metadata to DB (claim_documents)
     */
    public ClaimDocument upload(Long claimId, MultipartFile file) {

        if (claimId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "claimId is required");
        }

        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found"));

        // ✅ store on disk & build metadata
        ClaimDocument doc = storageService.storeFile(file, claim);

        // ✅ IMPORTANT: save metadata in DB
        return documentRepository.save(doc);
    }

    /**
     * List all documents for a claim.
     */
    public List<ClaimDocument> listByClaim(Long claimId) {
        if (claimId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "claimId is required");
        }
        return documentRepository.findByClaimId(claimId);
    }

    /**
     * Download by docId.
     */
    public Resource download(Long docId) {
        if (docId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "docId is required");
        }

        ClaimDocument doc = documentRepository.findById(docId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));

        File file = new File(doc.getFilePath());
        if (!file.exists()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File missing on server");
        }

        return new FileSystemResource(file);
    }

    public String getContentType(Long docId) {
        ClaimDocument doc = documentRepository.findById(docId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));
        return doc.getContentType();
    }

    public String getOriginalFileName(Long docId) {
        ClaimDocument doc = documentRepository.findById(docId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));
        return doc.getOriginalFileName();
    }
}