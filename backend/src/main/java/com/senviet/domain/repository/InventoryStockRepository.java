package com.senviet.domain.repository;

import com.senviet.domain.entity.InventoryStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * Kho dữ liệu Quản Lý Tồn Kho.
 */
@Repository
public interface InventoryStockRepository extends JpaRepository<InventoryStock, Long> {

    List<InventoryStock> findByBranchIdOrderByItemItemNameAsc(Long branchId);

    List<InventoryStock> findByBranchIdAndItemId(Long branchId, Long itemId);

    Optional<InventoryStock> findByBranchIdAndItemIdAndBatchId(Long branchId, Long itemId, Long batchId);

    Optional<InventoryStock> findByBatchId(Long batchId);

    @Query("SELECT COALESCE(SUM(s.quantity), 0) FROM InventoryStock s WHERE s.branch.id = :branchId AND s.item.id = :itemId")
    BigDecimal getTotalStockByBranchAndItem(@Param("branchId") Long branchId, @Param("itemId") Long itemId);
}
