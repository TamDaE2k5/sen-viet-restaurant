package com.senviet;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Lớp khởi chạy ứng dụng Sen Việt Restaurant Buffet Backend.
 * 
 * Quản trị Kho Bếp, Nhân sự & Chống Thất Thoát.
 */
@SpringBootApplication
@EnableJpaAuditing
public class RestaurantApplication {

    public static void main(String[] args) {
        SpringApplication.run(RestaurantApplication.class, args);
    }
}
