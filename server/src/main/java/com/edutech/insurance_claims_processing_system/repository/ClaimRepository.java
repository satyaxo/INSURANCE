package com.edutech.insurance_claims_processing_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.edutech.insurance_claims_processing_system.entity.Claim;
import com.edutech.insurance_claims_processing_system.entity.Investigator;
import com.edutech.insurance_claims_processing_system.entity.Policyholder;
import com.edutech.insurance_claims_processing_system.entity.Underwriter;
import com.edutech.insurance_claims_processing_system.entity.Adjuster;

import java.util.List;

@Repository
public interface ClaimRepository extends JpaRepository<Claim, Long> {

    List<Claim> findByPolicyholder(Policyholder policyholder);

    List<Claim> findByUnderwriter(Underwriter underwriter);

    List<Claim> findByInvestigator(Investigator investigator);

    List<Claim> findByUnderwriterId(Long underwriterId);

    // ✅ IMPORTANT: Unassigned SUBMITTED claims (adjuster_id NULL)
    // Works if Claim has: private Adjuster adjuster;
    List<Claim> findByAdjusterIsNullAndStatus(String status);

    // ✅ Claims assigned to an adjuster
    List<Claim> findByAdjuster(Adjuster adjuster);

    @Query(
        "SELECT c FROM Claim c " +
        "LEFT JOIN FETCH c.investigation " +
        "WHERE c.underwriter.id = :underwriterId"
    )
    List<Claim> findClaimsWithInvestigation(@Param("underwriterId") Long underwriterId);
}