package com.senviet.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO câu hỏi bài thi trả về cho nhân viên làm bài (ẩn đáp án đúng để chống gian lận).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamQuestionDto {
    private Long id;
    private String position;
    private String questionText;
    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;
    private Integer points;
}
