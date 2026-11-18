package com.senviet.domain.repository;

import com.senviet.domain.entity.Payroll;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PayrollRepository extends JpaRepository<Payroll, Long> {
    List<Payroll> findByBranchIdAndPayrollMonthOrderByUserId(Long branchId, String payrollMonth);
    List<Payroll> findByPayrollMonthOrderByBranchIdAscUserIdAsc(String payrollMonth);
    Optional<Payroll> findByUserIdAndPayrollMonth(Long userId, String payrollMonth);
    List<Payroll> findByUserIdOrderByPayrollMonthDesc(Long userId);
}
