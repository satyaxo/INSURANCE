package com.edutech.insurance_claims_processing_system.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.edutech.insurance_claims_processing_system.entity.Investigation;

@Repository
public interface InvestigationRepository extends JpaRepository<Investigation, Long> {

    @Query("SELECT i FROM Investigation i JOIN FETCH i.claim")
    List<Investigation> findAllWithClaim();

    boolean existsByClaimId(Long claimId);

    Optional<Investigation> findByClaimId(Long claimId);
}
