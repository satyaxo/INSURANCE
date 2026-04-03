package com.edutech.insurance_claims_processing_system.repository;

import java.util.Optional;
import com.edutech.insurance_claims_processing_system.entity.Investigation; // Make sure this import is here too
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InvestigationRepository extends JpaRepository<Investigation, Long> {
    Optional<Investigation> findByClaimId(Long claimId);
    
}

