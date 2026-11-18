package com.senviet.domain.repository;

import com.senviet.domain.entity.SalaryIncreaseProposal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SalaryIncreaseProposalRepository extends JpaRepository<SalaryIncreaseProposal, Long> {
    List<SalaryIncreaseProposal> findByBranchIdOrderByCreatedAtDesc(Long branchId);
    List<SalaryIncreaseProposal> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<SalaryIncreaseProposal> findFirstByUserIdAndExamQuarter(Long userId, String examQuarter);
    List<SalaryIncreaseProposal> findByUserIdAndStatus(Long userId, String status);
}
