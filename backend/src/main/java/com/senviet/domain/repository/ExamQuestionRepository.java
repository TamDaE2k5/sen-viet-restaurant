package com.senviet.domain.repository;

import com.senviet.domain.entity.ExamQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamQuestionRepository extends JpaRepository<ExamQuestion, Long> {
    List<ExamQuestion> findByPositionAndIsActiveTrue(String position);
    List<ExamQuestion> findByIsActiveTrue();
}
