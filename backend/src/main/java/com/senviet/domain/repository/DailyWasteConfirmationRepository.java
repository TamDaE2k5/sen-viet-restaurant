package com.senviet.domain.repository;

import com.senviet.domain.entity.DailyWasteConfirmation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * Kho dữ liệu Xác nhận Hủy Bỏ Món Dùng Trong Ngày Cuối Ca.
 */
@Repository
public interface DailyWasteConfirmationRepository extends JpaRepository<DailyWasteConfirmation, Long> {

    List<DailyWasteConfirmation> findByBranchIdAndWasteDateOrderByCreatedAtDesc(Long branchId, LocalDate wasteDate);

    List<DailyWasteConfirmation> findByBranchIdAndWasteDateAndShiftOrderByCreatedAtDesc(Long branchId, LocalDate wasteDate, String shift);
}
