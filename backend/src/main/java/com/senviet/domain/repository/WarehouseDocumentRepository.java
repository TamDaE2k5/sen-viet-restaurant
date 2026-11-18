package com.senviet.domain.repository;

import com.senviet.domain.entity.WarehouseDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Kho dữ liệu Phiếu Kho.
 */
@Repository
public interface WarehouseDocumentRepository extends JpaRepository<WarehouseDocument, Long> {

    Optional<WarehouseDocument> findByDocCode(String docCode);

    long countByDocCodeStartingWith(String prefix);

    List<WarehouseDocument> findByBranchIdOrderByCreatedAtDesc(Long branchId);

    @Query("SELECT d FROM WarehouseDocument d WHERE (cast(:branchId as long) IS NULL OR d.branch.id = :branchId) " +
           "AND (cast(:docType as string) IS NULL OR d.docType = :docType) " +
           "AND (cast(:status as string) IS NULL OR d.status = :status) " +
           "AND (cast(:fromTime as timestamp) IS NULL OR d.createdAt >= :fromTime) " +
           "AND (cast(:toTime as timestamp) IS NULL OR d.createdAt <= :toTime) " +
           "ORDER BY d.createdAt DESC")
    List<WarehouseDocument> searchDocuments(
            @Param("branchId") Long branchId,
            @Param("docType") String docType,
            @Param("status") String status,
            @Param("fromTime") Instant fromTime,
            @Param("toTime") Instant toTime
    );
}
