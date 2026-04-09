package com.edutech.insurance_claims_processing_system.repository;

import com.edutech.insurance_claims_processing_system.entity.Policy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PolicyRepository extends JpaRepository<Policy, Long> {

    // ✅ Find by policy number
    Optional<Policy> findByPolicyNumber(String policyNumber);

    // ✅ List all policies purchased by a policyholder
    List<Policy> findByPolicyholder_IdOrderByIdDesc(Long policyholderId);

    // ✅ Get ACTIVE + PAID policy for policyholder (claim eligibility)
    @Query(
        "SELECT p FROM Policy p " +
        "WHERE p.policyholder.id = :policyholderId " +
        "AND UPPER(p.policyStatus) = 'ACTIVE' " +
        "AND UPPER(p.paymentStatus) = 'PAID' " +
        "AND p.endDate >= :today " +
        "ORDER BY p.id DESC"
    )
    Optional<Policy> findActivePaidPolicy(
            @Param("policyholderId") Long policyholderId,
            @Param("today") LocalDate today
    );

    // ✅ Fast existence check (used before claim creation)
    @Query(
        "SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END " +
        "FROM Policy p " +
        "WHERE p.policyholder.id = :policyholderId " +
        "AND UPPER(p.policyStatus) = 'ACTIVE' " +
        "AND UPPER(p.paymentStatus) = 'PAID' " +
        "AND p.endDate >= :today"
    )
    boolean existsActivePaidPolicy(
            @Param("policyholderId") Long policyholderId,
            @Param("today") LocalDate today
    );

    // ✅ Razorpay order lookup
    Optional<Policy> findByRazorpayOrderId(String razorpayOrderId);

    // ✅ Policies by insurance type
    List<Policy> findByPolicyholder_IdAndInsuranceTypeIgnoreCaseOrderByIdDesc(
            Long policyholderId,
            String insuranceType
    );
}