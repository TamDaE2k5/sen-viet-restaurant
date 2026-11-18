package com.senviet.domain.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

/**
 * DTO nộp bài thi trắc nghiệm trực tuyến.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamSubmitRequest {

    // Map: Question ID -> Phương án chọn ('A', 'B', 'C', 'D')
    @NotEmpty(message = "Danh sách câu trả lời không được để trống")
    private Map<Long, String> answers;

    private Instant startedAt;

    @Builder.Default
    private String examQuarter = "Q4_2026";
}
