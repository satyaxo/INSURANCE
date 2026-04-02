package com.edutech.insurance_claims_processing_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.edutech.insurance_claims_processing_system.entity.Claim;
import com.edutech.insurance_claims_processing_system.entity.Investigator;
import com.edutech.insurance_claims_processing_system.entity.Policyholder;
import com.edutech.insurance_claims_processing_system.entity.Underwriter;

import java.util.List;

@Repository
public interface ClaimRepository extends JpaRepository<Claim, Long> {
    List<Claim> findByPolicyholder(Policyholder policyholder);

    List<Claim> findByUnderwriter(Underwriter underwriter);

    List<Claim> findByInvestigator(Investigator investigator);

    List<Claim> findByUnderwriterId(Long underwriterId);
    
 
   @Query(
        "SELECT c FROM Claim c " +
        "LEFT JOIN FETCH c.investigation " +
        "WHERE c.underwriter.id = :underwriterId"
    )

    List<Claim> findClaimsWithInvestigation(Long underwriterId);


}

