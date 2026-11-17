package com.senviet.domain.repository;

import com.senviet.domain.entity.SalaryRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SalaryRuleRepository extends JpaRepository<SalaryRule, Long> {
    Optional<SalaryRule> findFirstByBranchId(Long branchId);
}
