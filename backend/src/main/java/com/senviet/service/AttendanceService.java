package com.senviet.service;

import com.senviet.domain.dto.request.CheckInRequest;
import com.senviet.domain.dto.request.CheckOutRequest;
import com.senviet.domain.dto.response.AbandonmentScanResult;
import com.senviet.domain.dto.response.AttendanceResponse;
import com.senviet.domain.entity.*;
import com.senviet.domain.repository.*;
import com.senviet.exception.ApiException;
import com.senviet.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service Quản Lý Chấm Công Selfie Camera & Định Vị GPS Geofencing.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final ResignationRequestRepository resignationRequestRepository;
    private final PayrollRepository payrollRepository;
    private final AuditLogRepository auditLogRepository;
    private final NotificationLogRepository notificationLogRepository;

    // Khoảng cách Geofencing tối đa cho phép: 100 mét
    public static final double MAX_GEOFENCE_DISTANCE_METERS = 100.0;

    /**
     * Thực hiện Check-in chấm công đầu ca bằng ảnh selfie và tọa độ GPS.
     */
    @Transactional
    public AttendanceResponse checkIn(CheckInRequest request, UserPrincipal currentUser) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));
        Branch branch = branchRepository.findById(currentUser.getBranchId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chi nhánh"));

        Instant now = Instant.now();
        LocalDate today = LocalDate.now();

        // Xử lý Idempotency cho tình huống retry ngoại tuyến (Offline Resilience):
        // Nếu nhân viên vừa check-in ca này trong vòng 5 phút trước -> Trả lại bản ghi thành công
        Optional<Attendance> existingCheckIn = attendanceRepository.findFirstByUserIdAndAttendanceDateOrderByCheckInTimeDesc(currentUser.getId(), today);
        if (existingCheckIn.isPresent() && "DANG_LAM".equals(existingCheckIn.get().getStatus()) && existingCheckIn.get().getCheckOutTime() == null) {
            if (Duration.between(existingCheckIn.get().getCheckInTime(), now).toMinutes() < 5) {
                log.info("Xử lý idempotent check-in cho nhân viên [{}] ca [{}]", user.getFullName(), request.getShiftName());
                return mapToResponse(existingCheckIn.get());
            }
        }

        // Tính khoảng cách Haversine từ GPS thiết bị đến tọa độ chi nhánh
        BigDecimal distanceMeters = calculateDistance(
                request.getLatitude(), request.getLongitude(),
                branch.getLatitude(), branch.getLongitude()
        );

        boolean isValidLocation = distanceMeters.doubleValue() <= MAX_GEOFENCE_DISTANCE_METERS;

        // Tính số phút đi muộn dựa theo giờ bắt đầu ca
        int lateMinutes = calculateLateMinutes(now, request.getShiftName());

        Attendance attendance = Attendance.builder()
                .user(user)
                .branch(branch)
                .attendanceDate(today)
                .shiftName(request.getShiftName())
                .checkInTime(now)
                .checkInSelfieUrl(request.getSelfieUrl())
                .checkInLatitude(request.getLatitude())
                .checkInLongitude(request.getLongitude())
                .checkInDistanceMeters(distanceMeters)
                .isValidLocation(isValidLocation)
                .lateMinutes(lateMinutes)
                .status(isValidLocation ? "DANG_LAM" : "VI_PHAM_KHOANG_CACH")
                .build();

        attendanceRepository.save(attendance);
        log.info("Nhân viên [{}] check-in ca [{}] tại chi nhánh [{}]: Khoảng cách {}m, Hợp lệ: {}",
                user.getFullName(), request.getShiftName(), branch.getBranchName(), distanceMeters, isValidLocation);

        return mapToResponse(attendance);
    }

    /**
     * Thực hiện Check-out kết thúc ca làm việc.
     */
    @Transactional
    public AttendanceResponse checkOut(CheckOutRequest request, UserPrincipal currentUser) {
        LocalDate today = LocalDate.now();
        Attendance attendance = attendanceRepository.findFirstByUserIdAndAttendanceDateOrderByCheckInTimeDesc(currentUser.getId(), today)
                .orElseThrow(() -> new IllegalStateException("Bạn chưa thực hiện Check-in hôm nay"));

        Branch branch = attendance.getBranch();
        Instant now = Instant.now();

        // Xử lý Idempotency cho tình huống retry ngoại tuyến (Offline Resilience):
        // Nếu đã check-out trong vòng 5 phút trước -> Trả lại bản ghi đã hoàn tất
        if (attendance.getCheckOutTime() != null) {
            if (Duration.between(attendance.getCheckOutTime(), now).toMinutes() < 5) {
                log.info("Xử lý idempotent check-out cho nhân viên [{}]", currentUser.getUsername());
                return mapToResponse(attendance);
            }
        }

        BigDecimal distanceMeters = calculateDistance(
                request.getLatitude(), request.getLongitude(),
                branch.getLatitude(), branch.getLongitude()
        );

        // Tính số giờ làm thực tế
        Duration duration = Duration.between(attendance.getCheckInTime(), now);
        BigDecimal actualHours = BigDecimal.valueOf(duration.toMinutes() / 60.0).setScale(2, RoundingMode.HALF_UP);

        attendance.setCheckOutTime(now);
        attendance.setCheckOutSelfieUrl(request.getSelfieUrl());
        attendance.setCheckOutLatitude(request.getLatitude());
        attendance.setCheckOutLongitude(request.getLongitude());
        attendance.setCheckOutDistanceMeters(distanceMeters);
        attendance.setActualHours(actualHours);
        attendance.setStatus("HOAN_THANH");

        attendanceRepository.save(attendance);
        return mapToResponse(attendance);
    }

    @Transactional(readOnly = true)
    public List<AttendanceResponse> getTodayAttendances(Long branchId) {
        return attendanceRepository.findByBranchIdAndAttendanceDateOrderByCheckInTimeDesc(branchId, LocalDate.now())
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AttendanceResponse> getUserAttendanceHistory(Long userId) {
        return attendanceRepository.findByUserIdOrderByAttendanceDateDesc(userId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    /**
     * Quét nhân viên vắng mặt liên tiếp 3 ngày không chấm công (Cảnh báo bỏ việc).
     */
    @Transactional(readOnly = true)
    public AbandonmentScanResult scanSuspectedAbandonment(Long branchId) {
        LocalDate today = LocalDate.now();
        LocalDate threeDaysAgo = today.minusDays(3);

        List<User> activeUsers = userRepository.findByBranchIdAndStatus(branchId, "ACTIVE");
        List<AbandonmentScanResult.SuspectedUser> suspected = new ArrayList<>();

        for (User u : activeUsers) {
            List<Attendance> recentAttendances = attendanceRepository.findByUserIdAndAttendanceDateGreaterThanEqual(u.getId(), threeDaysAgo);
            if (recentAttendances.isEmpty()) {
                suspected.add(AbandonmentScanResult.SuspectedUser.builder()
                        .userId(u.getId())
                        .username(u.getUsername())
                        .fullName(u.getFullName())
                        .branchName(u.getBranch() != null ? u.getBranch().getBranchName() : "")
                        .consecutiveDaysAbsent(3)
                        .suggestion("Gợi ý: Có thể bỏ việc — Không chấm công 3 ngày liên tiếp")
                        .build());
            }
        }

        return AbandonmentScanResult.builder()
                .scanDate(today)
                .totalUsersScanned(activeUsers.size())
                .suspectedAbandonmentCount(suspected.size())
                .suspectedUsers(suspected)
                .build();
    }

    /**
     * Quản lý xác nhận nhân viên tự ý bỏ việc -> Tháng đó Lương = 0, loại khỏi danh sách chi trả.
     */
    @Transactional
    public ResignationRequest confirmAbandonment(Long userId, UserPrincipal manager) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhân viên ID: " + userId));
        Branch branch = branchRepository.findById(manager.getBranchId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chi nhánh"));

        user.setStatus("INACTIVE");
        userRepository.save(user);

        User managerUser = userRepository.findById(manager.getId()).orElse(null);

        ResignationRequest req = ResignationRequest.builder()
                .user(user)
                .branch(branch)
                .requestDate(LocalDate.now())
                .reason("Tự ý bỏ việc không thông báo (Nghỉ không phép liên tiếp 3 ngày)")
                .isAbandoned(true)
                .status("BO_VIEC")
                .approvedByUser(managerUser)
                .approvedAt(Instant.now())
                .managerNote("Bỏ việc — không trả theo quy định")
                .build();

        return resignationRequestRepository.save(req);
    }

    /**
     * Kế toán tổng hủy xác nhận bỏ việc nhầm.
     * Khôi phục trạng thái nhân viên về ACTIVE, tính lại bảng lương và ghi nhận audit log.
     *
     * @param resignationRequestId ID bản ghi bỏ việc
     * @param accountant           UserPrincipal kế toán tổng
     * @return Bản ghi ResignationRequest sau khi hủy
     */
    @Transactional
    public ResignationRequest cancelAbandonment(Long resignationRequestId, UserPrincipal accountant) {
        ResignationRequest req = resignationRequestRepository.findById(resignationRequestId)
                .orElseThrow(() -> new ApiException("Không tìm thấy đơn bỏ việc ID: " + resignationRequestId));

        User employee = req.getUser();
        User accountantUser = userRepository.findById(accountant.getId()).orElse(null);

        // 1. Cập nhật bản ghi bỏ việc sang CANCELLED
        req.setStatus("CANCELLED");
        req.setIsAbandoned(false);
        req.setCancelledByUser(accountantUser);
        req.setCancelledAt(Instant.now());
        req.setManagerNote("Đã hủy bỏ việc nhầm bởi Kế toán tổng " + accountant.getUsername());
        resignationRequestRepository.save(req);

        // 2. Khôi phục trạng thái nhân viên về ACTIVE
        employee.setStatus("ACTIVE");
        userRepository.save(employee);

        // 3. Khôi phục và tính toán lại bảng lương tháng hiện tại
        String currentMonth = LocalDate.now().toString().substring(0, 7);
        Optional<Payroll> payrollOpt = payrollRepository.findByUserIdAndPayrollMonth(employee.getId(), currentMonth);
        if (payrollOpt.isPresent()) {
            Payroll p = payrollOpt.get();
            p.setIsAbandoned(false);
            p.setExcludedFromCost(false);
            p.setStatus("CHO_DUYET");
            p.setNote("Đã khôi phục lương sau khi hủy xác nhận bỏ việc nhầm");

            BigDecimal base = p.getBaseSalary() != null && p.getBaseSalary().compareTo(BigDecimal.ZERO) > 0
                    ? p.getBaseSalary() : (employee.getBaseSalary() != null ? employee.getBaseSalary() : new BigDecimal("7500000.00"));
            p.setBaseSalary(base);
            BigDecimal standard = p.getStandardWorkDays() != null && p.getStandardWorkDays().compareTo(BigDecimal.ZERO) > 0
                    ? p.getStandardWorkDays() : new BigDecimal("26.0");
            BigDecimal actual = p.getActualWorkDays() != null && p.getActualWorkDays().compareTo(BigDecimal.ZERO) > 0
                    ? p.getActualWorkDays() : new BigDecimal("24.0");
            BigDecimal raise = p.getSalaryRaise() != null ? p.getSalaryRaise() : BigDecimal.ZERO;
            BigDecimal allowance = p.getAllowance() != null ? p.getAllowance() : new BigDecimal("500000.00");
            BigDecimal prorated = base.add(raise).multiply(actual).divide(standard, 2, RoundingMode.HALF_UP);
            BigDecimal gross = prorated.add(allowance);
            p.setGrossSalary(gross);
            BigDecimal advance = p.getAdvanceDeduction() != null ? p.getAdvanceDeduction() : BigDecimal.ZERO;
            BigDecimal penalty = p.getPenaltyDeduction() != null ? p.getPenaltyDeduction() : BigDecimal.ZERO;
            BigDecimal net = gross.subtract(advance).subtract(penalty);
            p.setNetSalary(net.compareTo(BigDecimal.ZERO) > 0 ? net : BigDecimal.ZERO);
            p.setUpdatedAt(Instant.now());
            payrollRepository.save(p);
        }

        // 4. Ghi Audit Log & Notification Log
        String logText = String.format("Kế toán tổng %s đã HỦY xác nhận bỏ việc nhầm cho nhân viên '%s' (ID: %d). Khôi phục trạng thái ACTIVE và tính lại lương.",
                accountant.getUsername(), employee.getFullName(), employee.getId());
        log.info("[CANCEL_ABANDONMENT] {}", logText);

        auditLogRepository.save(AuditLog.builder()
                .userId(accountant.getId())
                .action("CANCEL_ABANDONMENT")
                .targetEntity("ResignationRequest")
                .targetId(req.getId())
                .details(logText)
                .build());

        notificationLogRepository.save(NotificationLog.builder()
                .branch(req.getBranch())
                .channel("AUDIT_LOG")
                .recipient("ROLE_MANAGEMENT")
                .title("HỦY XÁC NHẬN BỎ VIỆC NHẦM")
                .content(logText)
                .status("SENT")
                .build());

        return req;
    }

    /**
     * Tính khoảng cách Haversine giữa 2 tọa độ GPS (mét).
     */
    public BigDecimal calculateDistance(BigDecimal lat1, BigDecimal lon1, BigDecimal lat2, BigDecimal lon2) {
        if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
            return BigDecimal.ZERO;
        }

        double earthRadius = 6371000.0; // Bán kính trái đất (mét)
        double dLat = Math.toRadians(lat2.doubleValue() - lat1.doubleValue());
        double dLon = Math.toRadians(lon2.doubleValue() - lon1.doubleValue());

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1.doubleValue())) * Math.cos(Math.toRadians(lat2.doubleValue())) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distance = earthRadius * c;

        return BigDecimal.valueOf(distance).setScale(2, RoundingMode.HALF_UP);
    }

    private int calculateLateMinutes(Instant checkInTime, String shiftName) {
        ZonedDateTime zdt = checkInTime.atZone(ZoneId.of("Asia/Ho_Chi_Minh"));
        LocalTime time = zdt.toLocalTime();

        LocalTime shiftStart = "CA_TOI".equalsIgnoreCase(shiftName) ? LocalTime.of(16, 0) : LocalTime.of(8, 0);

        if (time.isAfter(shiftStart)) {
            return (int) Duration.between(shiftStart, time).toMinutes();
        }
        return 0;
    }

    private AttendanceResponse mapToResponse(Attendance a) {
        return AttendanceResponse.builder()
                .id(a.getId())
                .userId(a.getUser().getId())
                .fullName(a.getUser().getFullName())
                .username(a.getUser().getUsername())
                .branchId(a.getBranch().getId())
                .branchName(a.getBranch().getBranchName())
                .attendanceDate(a.getAttendanceDate())
                .shiftName(a.getShiftName())
                .checkInTime(a.getCheckInTime())
                .checkInSelfieUrl(a.getCheckInSelfieUrl())
                .checkInDistanceMeters(a.getCheckInDistanceMeters())
                .isValidLocation(a.getIsValidLocation())
                .lateMinutes(a.getLateMinutes())
                .checkOutTime(a.getCheckOutTime())
                .checkOutSelfieUrl(a.getCheckOutSelfieUrl())
                .checkOutDistanceMeters(a.getCheckOutDistanceMeters())
                .earlyMinutes(a.getEarlyMinutes())
                .workShiftHours(a.getWorkShiftHours())
                .actualHours(a.getActualHours())
                .status(a.getStatus())
                .build();
    }
}
