package com.senviet.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Ngoại lệ nghiệp vụ chung của hệ thống.
 */
@Getter
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(String message) {
        super(message);
        this.status = HttpStatus.BAD_REQUEST;
    }

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }
}
