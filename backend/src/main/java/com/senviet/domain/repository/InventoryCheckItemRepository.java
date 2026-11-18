package com.senviet.domain.repository;

import com.senviet.domain.entity.InventoryCheckItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Kho dữ liệu Dòng Chi Tiết Biên Bản Kiểm Kê.
 */
@Repository
public interface InventoryCheckItemRepository extends JpaRepository<InventoryCheckItem, Long> {

    List<InventoryCheckItem> findByInventoryCheckId(Long checkId);
}
