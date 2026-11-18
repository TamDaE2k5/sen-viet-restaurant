package com.senviet.domain.repository;

import com.senviet.domain.entity.ExamSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExamSubmissionRepository extends JpaRepository<ExamSubmission, Long> {
    List<ExamSubmission> findByBranchIdOrderBySubmittedAtDesc(Long branchId);
    List<ExamSubmission> findByUserIdOrderBySubmittedAtDesc(Long userId);
    Optional<ExamSubmission> findFirstByUserIdAndExamQuarter(Long userId, String examQuarter);
}
