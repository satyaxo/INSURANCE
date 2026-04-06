package com.edutech.insurance_claims_processing_system.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.edutech.insurance_claims_processing_system.entity.EmailOtp;

@Repository
public interface EmailOtpRepository extends JpaRepository<EmailOtp, Long> {

    Optional<EmailOtp> findTopByEmailOrderByIdDesc(String email);

    boolean existsByEmailAndVerifiedTrue(String email);

    @Modifying
    @Transactional
    @Query("DELETE FROM EmailOtp e WHERE e.email = :email")
    void deleteByEmail(@Param("email") String email);
}
