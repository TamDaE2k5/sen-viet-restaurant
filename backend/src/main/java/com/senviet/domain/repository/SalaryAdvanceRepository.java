package com.senviet.domain.repository;

import com.senviet.domain.entity.SalaryAdvance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SalaryAdvanceRepository extends JpaRepository<SalaryAdvance, Long> {
    List<SalaryAdvance> findByBranchIdOrderByRequestDateDesc(Long branchId);
    List<SalaryAdvance> findByUserIdOrderByRequestDateDesc(Long userId);
    List<SalaryAdvance> findByUserIdAndDeductionMonth(Long userId, String deductionMonth);
    Optional<SalaryAdvance> findFirstByUserIdAndStatus(Long userId, String status);
    List<SalaryAdvance> findByDeductionMonthAndStatus(String deductionMonth, String status);
}
