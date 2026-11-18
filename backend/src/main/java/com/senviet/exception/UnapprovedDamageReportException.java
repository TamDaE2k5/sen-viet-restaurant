package com.senviet.exception;

import org.springframework.http.HttpStatus;

/**
 * Ngoại lệ chặn cứng khi món ăn đang có báo hỏng chờ Quản lý phê duyệt (Trạng thái CHO_DUYET).
 * Trả về mã lỗi HTTP 422 Unprocessable Entity theo quy tắc nghiệp vụ Phase 8.
 */
public class UnapprovedDamageReportException extends ApiException {

    public UnapprovedDamageReportException(String message) {
        super(HttpStatus.UNPROCESSABLE_ENTITY, message);
    }
}
