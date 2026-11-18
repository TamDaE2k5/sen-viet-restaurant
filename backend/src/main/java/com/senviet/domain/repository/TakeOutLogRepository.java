package com.senviet.domain.repository;

import com.senviet.domain.entity.TakeOutLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TakeOutLogRepository extends JpaRepository<TakeOutLog, Long> {
    List<TakeOutLog> findByBranchIdOrderByCreatedAtDesc(Long branchId);
}
