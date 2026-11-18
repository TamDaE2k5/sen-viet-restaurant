package com.senviet.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * DTO kết quả quét cảnh báo nhân viên có thể tự ý bỏ việc (3 ngày không chấm công).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AbandonmentScanResult {
    private LocalDate scanDate;
    private Integer totalUsersScanned;
    private Integer suspectedAbandonmentCount;
    private List<SuspectedUser> suspectedUsers;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SuspectedUser {
        private Long userId;
        private String username;
        private String fullName;
        private String branchName;
        private Integer consecutiveDaysAbsent;
        private String suggestion;
    }
}
