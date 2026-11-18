package com.senviet.domain.repository;

import com.senviet.domain.entity.ResignationRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResignationRequestRepository extends JpaRepository<ResignationRequest, Long> {
    List<ResignationRequest> findByBranchIdOrderByRequestDateDesc(Long branchId);
    List<ResignationRequest> findByUserId(Long userId);
    Optional<ResignationRequest> findFirstByUserIdAndStatusNot(Long userId, String status);
}
