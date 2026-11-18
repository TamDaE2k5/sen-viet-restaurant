package com.senviet.domain.repository;

import com.senviet.domain.entity.InventoryCheck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Kho dữ liệu Biên Bản Kiểm Kê Kho.
 */
@Repository
public interface InventoryCheckRepository extends JpaRepository<InventoryCheck, Long> {

    Optional<InventoryCheck> findByCheckCode(String checkCode);

    long countByCheckCodeStartingWith(String prefix);

    List<InventoryCheck> findByBranchIdOrderByCheckDateDescCreatedAtDesc(Long branchId);

    @Query("SELECT c FROM InventoryCheck c WHERE (cast(:branchId as long) IS NULL OR c.branch.id = :branchId) " +
           "AND (cast(:checkDate as date) IS NULL OR c.checkDate = :checkDate) " +
           "AND (cast(:shift as string) IS NULL OR c.shift = :shift) " +
           "ORDER BY c.checkDate DESC, c.id DESC")
    List<InventoryCheck> searchChecks(
            @Param("branchId") Long branchId,
            @Param("checkDate") LocalDate checkDate,
            @Param("shift") String shift
    );
}
