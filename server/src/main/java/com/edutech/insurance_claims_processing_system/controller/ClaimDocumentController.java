package com.edutech.insurance_claims_processing_system.controller;

import java.util.List;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.edutech.insurance_claims_processing_system.entity.ClaimDocument;
import com.edutech.insurance_claims_processing_system.service.ClaimDocumentService;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ClaimDocumentController {

    private final ClaimDocumentService claimDocumentService;

    public ClaimDocumentController(ClaimDocumentService claimDocumentService) {
        this.claimDocumentService = claimDocumentService;
    }

    /**
     * ✅ Upload ONE document for a claim (optional)
     * URL: POST /api/policyholder/claim/{claimId}/documents
     * Body: multipart/form-data (key = file)
     */
    @PostMapping("/policyholder/claim/{claimId}/documents")
    public ResponseEntity<ClaimDocument> uploadDocument(
            @PathVariable Long claimId,
            @RequestParam("file") MultipartFile file) {

        ClaimDocument saved = claimDocumentService.upload(claimId, file);
        return ResponseEntity.ok(saved);
    }

    /**
     * ✅ List all documents for a claim (any authenticated role can view)
     * URL: GET /api/claim/{claimId}/documents
     */
    @GetMapping("/claim/{claimId}/documents")
    public ResponseEntity<List<ClaimDocument>> getDocumentsByClaim(@PathVariable Long claimId) {
        return ResponseEntity.ok(claimDocumentService.listByClaim(claimId));
    }

    /**
     * ✅ Download a document by docId
     * URL: GET /api/documents/{docId}/download
     */
    @GetMapping("/documents/{docId}/download")
    public ResponseEntity<Resource> download(@PathVariable Long docId) {

        Resource resource = claimDocumentService.download(docId);

        String contentType = claimDocumentService.getContentType(docId);
        String fileName = claimDocumentService.getOriginalFileName(docId);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .body(resource);
    }
}
