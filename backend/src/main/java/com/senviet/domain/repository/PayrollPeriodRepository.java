package com.senviet.domain.repository;

import com.senviet.domain.entity.PayrollPeriod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository truy vấn kỳ bảng lương.
 */
@Repository
public interface PayrollPeriodRepository extends JpaRepository<PayrollPeriod, Long> {

    Optional<PayrollPeriod> findByPeriodMonthAndBranchId(String periodMonth, Long branchId);

    Optional<PayrollPeriod> findFirstByPeriodMonth(String periodMonth);

    List<PayrollPeriod> findByPeriodMonth(String periodMonth);
}
