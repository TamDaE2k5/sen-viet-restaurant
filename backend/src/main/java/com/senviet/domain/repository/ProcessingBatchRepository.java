package com.senviet.domain.repository;

import com.senviet.domain.entity.ProcessingBatch;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProcessingBatchRepository extends JpaRepository<ProcessingBatch, Long> {

    boolean existsByBranchIdAndItemIdAndStatus(Long branchId, Long itemId, String status);

    @EntityGraph(attributePaths = {"item", "recipe", "startedByUser", "finishedByUser"})
    List<ProcessingBatch> findByBranchIdOrderByStartedAtDesc(Long branchId);

    @EntityGraph(attributePaths = {"item", "recipe", "startedByUser", "finishedByUser"})
    List<ProcessingBatch> findByBranchIdAndStatusOrderByStartedAtDesc(Long branchId, String status);

    @EntityGraph(attributePaths = {"item", "recipe", "startedByUser", "finishedByUser"})
    Optional<ProcessingBatch> findFirstByBranchIdAndItemIdAndStatusOrderByStartedAtDesc(
            Long branchId, Long itemId, String status);
}
