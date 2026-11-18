package com.senviet.domain.repository;

import com.senviet.domain.entity.UniformAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UniformAllocationRepository extends JpaRepository<UniformAllocation, Long> {
    List<UniformAllocation> findByUserId(Long userId);
    List<UniformAllocation> findByUserIdAndIsReturnedFalse(Long userId);
    List<UniformAllocation> findByBranchId(Long branchId);
}
