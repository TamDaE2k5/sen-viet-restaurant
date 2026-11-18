package com.senviet.domain.repository;

import com.senviet.domain.entity.LineItemLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface LineItemLogRepository extends JpaRepository<LineItemLog, Long> {

    boolean existsByRequestId(String requestId);

    @Query("SELECT l.item.id, l.item.itemName, SUM(l.quantity) " +
           "FROM LineItemLog l " +
           "WHERE l.branch.id = :branchId AND l.createdAt >= :since " +
           "GROUP BY l.item.id, l.item.itemName")
    List<Object[]> countItemsByBranchAndDate(@Param("branchId") Long branchId, @Param("since") Instant since);
}
