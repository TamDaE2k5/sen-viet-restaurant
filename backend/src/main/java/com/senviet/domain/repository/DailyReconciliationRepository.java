package com.senviet.domain.repository;

import com.senviet.domain.entity.DailyReconciliation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyReconciliationRepository extends JpaRepository<DailyReconciliation, Long> {
    List<DailyReconciliation> findByBranchIdAndReconDateOrderByIsOverThresholdDesc(Long branchId, LocalDate reconDate);
    List<DailyReconciliation> findByBranchIdAndReconDateAndShiftTypeOrderByIsOverThresholdDesc(Long branchId, LocalDate reconDate, String shiftType);
    Optional<DailyReconciliation> findFirstByBranchIdAndItemIdAndReconDateAndShiftType(Long branchId, Long itemId, LocalDate reconDate, String shiftType);
}
