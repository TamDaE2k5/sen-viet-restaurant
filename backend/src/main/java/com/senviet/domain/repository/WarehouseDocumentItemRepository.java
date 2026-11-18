package com.senviet.domain.repository;

import com.senviet.domain.entity.WarehouseDocumentItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Kho dữ liệu Chi Tiết Phiếu Kho.
 */
@Repository
public interface WarehouseDocumentItemRepository extends JpaRepository<WarehouseDocumentItem, Long> {

    List<WarehouseDocumentItem> findByDocumentId(Long documentId);

    List<WarehouseDocumentItem> findByBatchId(Long batchId);
}
