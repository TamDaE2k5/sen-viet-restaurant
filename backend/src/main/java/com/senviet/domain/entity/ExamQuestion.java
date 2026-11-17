package com.senviet.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Thực thể ngân hàng câu hỏi thi trắc nghiệm định kỳ theo vị trí.
 */
@Entity
@Table(name = "exam_questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ExamQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "position", length = 50, nullable = false)
    private String position;

    @Column(name = "question_text", columnDefinition = "TEXT", nullable = false)
    private String questionText;

    @Column(name = "option_a", columnDefinition = "TEXT", nullable = false)
    private String optionA;

    @Column(name = "option_b", columnDefinition = "TEXT", nullable = false)
    private String optionB;

    @Column(name = "option_c", columnDefinition = "TEXT", nullable = false)
    private String optionC;

    @Column(name = "option_d", columnDefinition = "TEXT", nullable = false)
    private String optionD;

    @Column(name = "correct_option", length = 5, nullable = false)
    private String correctOption;

    @Column(name = "points", nullable = false)
    @Builder.Default
    private Integer points = 10;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
