package com.edutech.insurance_claims_processing_system.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;

import com.edutech.insurance_claims_processing_system.entity.Claim;
import com.edutech.insurance_claims_processing_system.entity.Investigator;
import com.edutech.insurance_claims_processing_system.entity.Policyholder;
import com.edutech.insurance_claims_processing_system.entity.Underwriter;
import com.edutech.insurance_claims_processing_system.repository.ClaimRepository;
import com.edutech.insurance_claims_processing_system.repository.InvestigatorRepository;
import com.edutech.insurance_claims_processing_system.repository.PolicyholderRepository;
import com.edutech.insurance_claims_processing_system.repository.UnderwriterRepository;

import java.io.IOException;
import com.edutech.insurance_claims_processing_system.dto.ClaimDocumentDTO;
import com.edutech.insurance_claims_processing_system.entity.ClaimDocument;
import com.edutech.insurance_claims_processing_system.repository.ClaimDocumentRepository;

import java.io.File;
import java.util.stream.Collectors;


import java.util.Date;
import java.util.List;

@Service
public class ClaimService {

    private final ClaimRepository claimRepository;
    private final PolicyholderRepository policyholderRepository;
    private final UnderwriterRepository underwriterRepository;
    private final InvestigatorRepository investigatorRepository; 
    private ClaimDocumentRepository documentRepository;

    
    @Autowired
    public ClaimService(
            ClaimRepository claimRepository,
            PolicyholderRepository policyholderRepository,
            UnderwriterRepository underwriterRepository,
            InvestigatorRepository investigatorRepository,
            ClaimDocumentRepository documentRepository) {

        this.claimRepository = claimRepository;
        this.policyholderRepository = policyholderRepository;
        this.underwriterRepository = underwriterRepository;
        this.investigatorRepository = investigatorRepository;
       // this.ClaimDocumentRepository =documentRepository;
       this.documentRepository = documentRepository;
    }

    /* ================= POLICYHOLDER ================= */

    public Claim submitClaim(Long policyholderId, Claim claim) {

        Policyholder policyholder = policyholderRepository.findById(policyholderId)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Policyholder not found"));

        claim.setPolicyholder(policyholder);
        claim.setDate(new Date());
        claim.setStatus("SUBMITTED");

        return claimRepository.save(claim);
    }

public void saveDocuments(Long claimId, List<MultipartFile> files) {

    Claim claim = claimRepository.findById(claimId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found"));

    for (MultipartFile file : files) {
        try {
            String dir = "uploads/claims/" + claimId;
            new File(dir).mkdirs();

            String path = dir + "/" + file.getOriginalFilename();

            // ✅ This can throw IOException -> catch it
            file.transferTo(new File(path));

            ClaimDocument doc = new ClaimDocument();
            doc.setFileName(file.getOriginalFilename());
            doc.setFilePath(path);
            doc.setClaim(claim);

            documentRepository.save(doc);

        } catch (IOException e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to save file: " + file.getOriginalFilename(),
                    e
            );
        }
    }
}


public List<ClaimDocumentDTO> getDocuments(Long claimId) {
    return documentRepository.findByClaimId(claimId)
        .stream()
        .map(doc -> new ClaimDocumentDTO(doc.getId(), doc.getFileName(), "/uploads/" + doc.getFilePath()))
        .collect(Collectors.toList());
}

    public List<Claim> getClaimsByPolicyholder(Long policyholderId) {

        Policyholder policyholder = policyholderRepository.findById(policyholderId)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Policyholder not found"));

        return claimRepository.findByPolicyholder(policyholder);
    }

    /* ================= ADJUSTER ================= */

    public List<Claim> getAllClaims() {
        return claimRepository.findAll();
    }

    public Claim updateClaim(Long id, Claim claimDetails) {

        Claim claim = claimRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found"));

        claim.setDescription(claimDetails.getDescription());
        claim.setStatus(claimDetails.getStatus());

        return claimRepository.save(claim);
    }

    public Claim assignClaimToUnderwriter(Long claimId, Long underwriterId) {

        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found"));

        Underwriter underwriter = underwriterRepository.findById(underwriterId)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Underwriter not found"));

        claim.setUnderwriter(underwriter);
        claim.setStatus("UNDER_REVIEW");

        return claimRepository.save(claim);
    }

    public Claim assignClaimToInvestigator(Long claimId, Long investigatorId) {

        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found"));

        Investigator investigator = investigatorRepository.findById(investigatorId)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Investigator not found"));

        claim.setInvestigator(investigator);
        claim.setStatus("IN_PROGRESS");

        return claimRepository.save(claim);
    }
    public void deleteClaim(Long claimId) {
    if (!claimRepository.existsById(claimId)) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found");
    }
    claimRepository.deleteById(claimId);
}

    /* ================= INVESTIGATOR ================= */

    public List<Claim> getClaimsByInvestigator(Long investigatorId) {

        Investigator investigator = investigatorRepository.findById(investigatorId)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Investigator not found"));

        return claimRepository.findByInvestigator(investigator);
    }

    /* ================= ✅ UNDERWRITER (KEY FIX) ================= */

    /**
     * ✅ Returns ALL claims assigned to underwriter
     * ✅ Includes investigation when completed
     * ✅ No status filtering
     */
    public List<Claim> getClaimsForUnderwriter(Long underwriterId) {

        Underwriter underwriter = underwriterRepository.findById(underwriterId)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Underwriter not found"));

        return claimRepository.findClaimsWithInvestigation(underwriterId);
    }

    /**
     * ✅ Final approve / reject
     * ✅ Allowed only after investigation
     */
    public Claim reviewClaim(Long claimId, String status) {

        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found"));

        if (claim.getInvestigation() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Investigation not completed yet"
            );
        }

        if (!"APPROVED".equalsIgnoreCase(status)
                && !"REJECTED".equalsIgnoreCase(status)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid status"
            );
        }

        claim.setStatus(status.toUpperCase());
        return claimRepository.save(claim);
    }
}




// package com.edutech.insurance_claims_processing_system.service;

// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.http.HttpStatus;
// import org.springframework.stereotype.Service;
// import org.springframework.web.server.ResponseStatusException;

// import com.edutech.insurance_claims_processing_system.entity.Claim;
// import com.edutech.insurance_claims_processing_system.entity.Investigator;
// import com.edutech.insurance_claims_processing_system.entity.Policyholder;
// import com.edutech.insurance_claims_processing_system.entity.Underwriter;
// import com.edutech.insurance_claims_processing_system.repository.ClaimRepository;
// import com.edutech.insurance_claims_processing_system.repository.InvestigatorRepository;
// import com.edutech.insurance_claims_processing_system.repository.PolicyholderRepository;
// import com.edutech.insurance_claims_processing_system.repository.UnderwriterRepository;

// import java.util.Date;
// import java.util.List;

// @Service
// public class ClaimService {

//     private final ClaimRepository claimRepository;
//     private final PolicyholderRepository policyholderRepository;
//     private final UnderwriterRepository underwriterRepository;
//     private final InvestigatorRepository investigatorRepository;

//     @Autowired

//     public ClaimService(ClaimRepository claimRepository, PolicyholderRepository policyholderRepository,
//             UnderwriterRepository underwriterRepository, InvestigatorRepository investigatorRepository) {
//         this.claimRepository = claimRepository;
//         this.policyholderRepository = policyholderRepository;
//         this.underwriterRepository = underwriterRepository;
//         this.investigatorRepository = investigatorRepository;
//     }

//     /**
//      * Creates a new claim.
//      */
//     public Claim createClaim(Claim claim) {
//         if (claim == null) {
//             throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
//         }

//         claim.setDate(new Date());
//         // claim.setStatus("SUBMITTED");
//         return claimRepository.save(claim);
//     }

//     /**
//      * Updates claim details by ID.
//      */
//     public Claim updateClaim(Long id, Claim claimDetails) {
//         if (id == null || claimDetails == null) {
//             throw new ResponseStatusException(
//                     HttpStatus.FORBIDDEN,
//                     "Access denied");
//         }

//         Claim existingClaim = claimRepository.findById(id)
//                 .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied"));

//         existingClaim.setDescription(claimDetails.getDescription());
//         existingClaim.setStatus(claimDetails.getStatus());

//         return claimRepository.save(existingClaim);
//     }

//     /**
//      * Retrieves all claims.
//      */
//     public List<Claim> getAllClaims() {
//         return claimRepository.findAll();
//     }

//     /**
//      * Submits a claim for a specific policyholder.
//      */
//     public Claim submitClaim(Long policyholderId, Claim claim) {
//         if (policyholderId == null || claim == null) {
//             throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
//         }

//         Policyholder policyholder = policyholderRepository.findById(policyholderId)
//                 .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied"));

//         claim.setPolicyholder(policyholder);
//         claim.setDate(new Date());
//         claim.setStatus("SUBMITTED");

//         return claimRepository.save(claim);
//     }

//     /**
//      * Fetches all claims associated with a policyholder.
//      */
//     public List<Claim> getClaimsByPolicyholder(Long policyholderId) {
//         if (policyholderId == null) {
//             throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
//         }

//         Policyholder policyholder = policyholderRepository.findById(policyholderId)
//                 .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied"));

//         return claimRepository.findByPolicyholder(policyholder);
//     }




//     public Claim reviewClaim(Long id, String status) {

//     Claim claim = claimRepository.findById(id)
//             .orElseThrow(() ->
//                     new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found"));

//     if (claim.getInvestigation() == null) {
//         throw new ResponseStatusException(
//                 HttpStatus.BAD_REQUEST,
//                 "Investigation report not completed yet"
//         );
//     }

//     if (!"APPROVED".equalsIgnoreCase(status)
//             && !"REJECTED".equalsIgnoreCase(status)) {
//         throw new ResponseStatusException(
//                 HttpStatus.BAD_REQUEST,
//                 "Invalid status"
//         );
//     }

//     claim.setStatus(status.toUpperCase());
//     return claimRepository.save(claim);
// }


//     /**
//      * Updates claim status during review.
//      */
//     // public Claim reviewClaim(Long id, String status) {
//     //     if (id == null || status == null) {
//     //         throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
//     //     }

//     //     Claim claim = claimRepository.findById(id)
//     //             .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied"));

//     //     claim.setStatus(status);
//     //     return claimRepository.save(claim);
//     // }

//     /**
//      * Retrieves claims assigned to a specific underwriter.
//      */
//     public List<Claim> getClaimsForReview(Long underwriterId) {
//         if (underwriterId == null) {
//             throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
//         }

//         Underwriter underwriter = underwriterRepository.findById(underwriterId)
//                 .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied"));

//         return claimRepository.findByUnderwriter(underwriter);
//     }

//     /**
//      * Assigns a claim to an underwriter.
//      */
//     public Claim assignClaimToUnderwriter(Long claimId, Long underwriterId) {
//         if (claimId == null || underwriterId == null) {
//             throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
//         }

//         Claim claim = claimRepository.findById(claimId)
//                 .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied"));

//         Underwriter underwriter = underwriterRepository.findById(underwriterId)
//                 .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied"));

//         claim.setUnderwriter(underwriter);
//         claim.setStatus("UNDER REVIEW");

//         return claimRepository.save(claim);
//     }

//     public Claim assignClaimToInvestigator(Long claimId, Long investigatorId) {

//         Claim claim = claimRepository.findById(claimId)
//                 .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found"));

//         Investigator investigator = investigatorRepository.findById(investigatorId)
//                 .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Investigator not found"));

//         // ✅ Assign investigator
//         claim.setInvestigator(investigator);

//         // ✅ Update workflow status logically
//         claim.setStatus("IN_PROGRESS");

//         return claimRepository.save(claim);
//     }

// public List<Claim> getClaimsByInvestigator(Long investigatorId) {

//     Investigator investigator = investigatorRepository.findById(investigatorId)
//             .orElseThrow(() ->
//                     new ResponseStatusException(HttpStatus.NOT_FOUND, "Investigator not found"));

//     return claimRepository.findByInvestigator(investigator);
// }

// public List<Claim> getClaimsForUnderwriter(Long underwriterId) {

//     Underwriter underwriter = underwriterRepository.findById(underwriterId)
//             .orElseThrow(() ->
//                     new ResponseStatusException(HttpStatus.NOT_FOUND, "Underwriter not found"));

//     return claimRepository.findClaimsWithInvestigation(underwriterId);
// }




// }