package com.senviet.domain.repository;

import com.senviet.domain.entity.DamageReport;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DamageReportRepository extends JpaRepository<DamageReport, Long> {

    @EntityGraph(attributePaths = {"item", "reportedByUser", "approvedByUser"})
    List<DamageReport> findByBranchIdOrderByCreatedAtDesc(Long branchId);

    @EntityGraph(attributePaths = {"item", "reportedByUser", "approvedByUser"})
    List<DamageReport> findByBranchIdAndStatusOrderByCreatedAtDesc(Long branchId, String status);
}
