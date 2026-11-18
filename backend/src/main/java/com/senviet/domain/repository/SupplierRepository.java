package com.senviet.domain.repository;

import com.senviet.domain.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Kho dữ liệu Nhà Cung Cấp.
 */
@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {

    Optional<Supplier> findBySupplierCode(String supplierCode);

    boolean existsBySupplierCode(String supplierCode);

    List<Supplier> findByStatusOrderBySupplierNameAsc(String status);

    @Query("SELECT s FROM Supplier s WHERE " +
           "(LOWER(s.supplierCode) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(s.supplierName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(s.phone) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND (:status IS NULL OR s.status = :status) " +
           "ORDER BY s.supplierName ASC")
    List<Supplier> searchSuppliersWithKeyword(@Param("keyword") String keyword, @Param("status") String status);
}
