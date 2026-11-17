package com.senviet.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * DTO kết quả nộp bài thi.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamSubmissionDto {
    private Long id;
    private Long userId;
    private String fullName;
    private String examQuarter;
    private Instant startedAt;
    private Instant submittedAt;
    private Integer durationSeconds;
    private BigDecimal theoryScore;
    private BigDecimal practicalScore;
    private BigDecimal totalScore;
    private String practicalComment;
    private String status;
    private Boolean isPassed;
}
