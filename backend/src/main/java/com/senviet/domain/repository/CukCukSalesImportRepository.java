package com.senviet.domain.repository;

import com.senviet.domain.entity.CukCukSalesImport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CukCukSalesImportRepository extends JpaRepository<CukCukSalesImport, Long> {
    List<CukCukSalesImport> findByBranchIdOrderByImportDateDesc(Long branchId);
    Optional<CukCukSalesImport> findFirstByBranchIdAndImportDateAndShiftType(Long branchId, LocalDate importDate, String shiftType);
    Optional<CukCukSalesImport> findFirstByBranchIdAndImportDate(Long branchId, LocalDate importDate);
}
