package com.senviet.domain.repository;

import com.senviet.domain.entity.ImportBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Kho dữ liệu Lô Nhập Hàng.
 */
@Repository
public interface ImportBatchRepository extends JpaRepository<ImportBatch, Long> {

    Optional<ImportBatch> findByBatchCode(String batchCode);

    boolean existsByBatchCode(String batchCode);

    long countByBatchCodeStartingWith(String prefix);

    List<ImportBatch> findByBranchIdOrderByCreatedAtDesc(Long branchId);

    List<ImportBatch> findByBranchIdAndCurrentStockGreaterThanOrderByImportDateAsc(Long branchId, BigDecimal minStock);

    List<ImportBatch> findByBranchIdAndItemIdAndCurrentStockGreaterThanOrderByImportDateAsc(Long branchId, Long itemId, BigDecimal minStock);

    List<ImportBatch> findBySupplierId(Long supplierId);

    @Query("SELECT b FROM ImportBatch b WHERE (cast(:branchId as long) IS NULL OR b.branch.id = :branchId) " +
           "AND (cast(:startDate as date) IS NULL OR b.importDate >= :startDate) " +
           "AND (cast(:endDate as date) IS NULL OR b.importDate <= :endDate) " +
           "AND (cast(:itemId as long) IS NULL OR b.item.id = :itemId) " +
           "AND (cast(:supplierId as long) IS NULL OR b.supplier.id = :supplierId) " +
           "ORDER BY b.importDate DESC, b.id DESC")
    List<ImportBatch> searchBatches(
            @Param("branchId") Long branchId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("itemId") Long itemId,
            @Param("supplierId") Long supplierId
    );
}
