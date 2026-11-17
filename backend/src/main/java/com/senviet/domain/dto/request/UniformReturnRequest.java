package com.senviet.domain.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO xác nhận checklist thu hồi đồng phục khi nghỉ việc.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UniformReturnRequest {
    // Danh sách ID cấp phát đồng phục đã nhận lại đầy đủ
    private List<Long> returnedAllocationIds;
    private String managerNote;
}
