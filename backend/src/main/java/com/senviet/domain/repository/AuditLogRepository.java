package com.senviet.domain.repository;

import com.senviet.domain.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository truy vấn nhật ký kiểm toán hệ thống.
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<AuditLog> findByTargetEntityAndTargetIdOrderByCreatedAtDesc(String targetEntity, Long targetId);
}
