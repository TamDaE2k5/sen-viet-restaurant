package com.senviet;

import com.senviet.service.AttendanceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Kiểm thử Unit Test cho Phân Hệ Chấm Công GPS Geofencing (AttendanceService).
 */
class AttendanceServiceTest {

    private AttendanceService attendanceService;

    @BeforeEach
    void setUp() {
        // AttendanceService có thể khởi tạo mà không cần mock repo cho hàm tính khoảng cách
        attendanceService = new AttendanceService(null, null, null, null);
    }

    @Test
    @DisplayName("Tọa độ trùng khớp tuyệt đối (0 mét) -> Hợp lệ trong Geofencing 100m")
    void testCalculateDistance_ExactSameCoordinate_ShouldReturnZero() {
        BigDecimal lat = new BigDecimal("21.592700");
        BigDecimal lon = new BigDecimal("105.844200");

        BigDecimal distance = attendanceService.calculateDistance(lat, lon, lat, lon);

        assertThat(distance).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(distance.doubleValue()).isLessThanOrEqualTo(AttendanceService.MAX_GEOFENCE_DISTANCE_METERS);
    }

    @Test
    @DisplayName("Nhân viên đứng cách chi nhánh ~15m -> Hợp lệ (<= 100m)")
    void testCalculateDistance_WithinGeofence_ShouldBeValid() {
        // Chi nhánh Thái Nguyên
        BigDecimal branchLat = new BigDecimal("21.592700");
        BigDecimal branchLon = new BigDecimal("105.844200");

        // Nhân viên đứng ở bãi đỗ xe đối diện
        BigDecimal userLat = new BigDecimal("21.592800");
        BigDecimal userLon = new BigDecimal("105.844300");

        BigDecimal distance = attendanceService.calculateDistance(userLat, userLon, branchLat, branchLon);

        assertThat(distance.doubleValue()).isGreaterThan(0.0);
        assertThat(distance.doubleValue()).isLessThan(30.0); // Xấp xỉ ~15m
        assertThat(distance.doubleValue()).isLessThanOrEqualTo(AttendanceService.MAX_GEOFENCE_DISTANCE_METERS);
    }

    @Test
    @DisplayName("Nhân viên cách nhà hàng 500m (ở nhà chấm hộ) -> Vượt phạm vi Geofencing 100m")
    void testCalculateDistance_OutOfGeofence_ShouldExceed100Meters() {
        BigDecimal branchLat = new BigDecimal("21.592700");
        BigDecimal branchLon = new BigDecimal("105.844200");

        // Cách nhà hàng ~500 mét
        BigDecimal userLat = new BigDecimal("21.597000");
        BigDecimal userLon = new BigDecimal("105.844200");

        BigDecimal distance = attendanceService.calculateDistance(userLat, userLon, branchLat, branchLon);

        assertThat(distance.doubleValue()).isGreaterThan(400.0);
        assertThat(distance.doubleValue()).isGreaterThan(AttendanceService.MAX_GEOFENCE_DISTANCE_METERS);
    }

    @Test
    @DisplayName("Tọa độ null -> Trả về 0 tránh Exception gây treo ứng dụng")
    void testCalculateDistance_NullCoordinates_ShouldReturnZero() {
        BigDecimal distance = attendanceService.calculateDistance(null, null, new BigDecimal("21.5927"), new BigDecimal("105.8442"));
        assertThat(distance).isEqualByComparingTo(BigDecimal.ZERO);
    }
}
