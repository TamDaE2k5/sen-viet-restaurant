package com.senviet.domain.repository;

import com.senviet.domain.entity.InventorySnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface InventorySnapshotRepository extends JpaRepository<InventorySnapshot, Long> {
    List<InventorySnapshot> findByBranchIdAndSnapshotDate(Long branchId, LocalDate snapshotDate);
    List<InventorySnapshot> findByBranchIdAndSnapshotDateAndShiftType(Long branchId, LocalDate snapshotDate, String shiftType);
    Optional<InventorySnapshot> findFirstByBranchIdAndItemIdAndSnapshotDateAndShiftType(Long branchId, Long itemId, LocalDate snapshotDate, String shiftType);
}
