package com.edutech.insurance_claims_processing_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.edutech.insurance_claims_processing_system.entity.Adjuster;
import com.edutech.insurance_claims_processing_system.entity.Claim;
import com.edutech.insurance_claims_processing_system.entity.Investigator;
import com.edutech.insurance_claims_processing_system.entity.Policyholder;
import com.edutech.insurance_claims_processing_system.entity.Underwriter;

import java.util.Collection;
import java.util.List;

@Repository
public interface ClaimRepository extends JpaRepository<Claim, Long> {

    List<Claim> findByPolicyholder(Policyholder policyholder);

    List<Claim> findByUnderwriter(Underwriter underwriter);

    List<Claim> findByInvestigator(Investigator investigator);

    List<Claim> findByUnderwriterId(Long underwriterId);

    // Update page inbox: SUBMITTED only
    List<Claim> findByAdjusterIsNullAndStatus(String status);

    // Optional: assigned to adjuster
    List<Claim> findByAdjuster(Adjuster adjuster);

    // Assign dropdown: ONLY UNDER_PROGRESS and unassigned to investigator+underwriter
    List<Claim> findByStatusInAndInvestigatorIsNullAndUnderwriterIsNull(Collection<String> statuses);

    @Query(
        "SELECT c FROM Claim c " +
        "LEFT JOIN FETCH c.investigation " +
        "WHERE c.underwriter.id = :underwriterId"
    )
    List<Claim> findClaimsWithInvestigation(@Param("underwriterId") Long underwriterId);

    
@Query(
  "SELECT c FROM Claim c " +
  "LEFT JOIN FETCH c.investigation " +
  "WHERE c.policyholder.id = :policyholderId"
)
List<Claim> findPolicyholderClaimsWithInvestigation(
        @Param("policyholderId") Long policyholderId
);


@Query("SELECT c FROM Claim c WHERE c.status = :status AND (c.investigator IS NULL OR c.underwriter IS NULL)")
List<Claim> findAssignableClaims(@Param("status") String status);

}
