package com.senviet.controller;

import com.senviet.domain.dto.request.CheckInRequest;
import com.senviet.domain.dto.request.CheckOutRequest;
import com.senviet.domain.dto.request.ExamSubmitRequest;
import com.senviet.domain.dto.request.GradePracticalRequest;
import com.senviet.domain.dto.request.UniformReturnRequest;
import com.senviet.domain.dto.response.AbandonmentScanResult;
import com.senviet.domain.dto.response.ApiResponse;
import com.senviet.domain.dto.response.AttendanceResponse;
import com.senviet.domain.dto.response.ExamQuestionDto;
import com.senviet.domain.dto.response.ExamSubmissionDto;
import com.senviet.domain.dto.response.UniformAllocationDto;
import com.senviet.domain.entity.ResignationRequest;
import com.senviet.domain.entity.UniformItem;
import com.senviet.security.UserPrincipal;
import com.senviet.service.AttendanceService;
import com.senviet.service.ExamService;
import com.senviet.service.UniformAndResignationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller Quản Lý Nhân Sự, Chấm Công GPS Geofencing, Thi Tuyển Trực Tuyến & Bàn Giao Đồng Phục.
 */
@RestController
@RequestMapping("/api/v1/hr")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "HR & Attendance", description = "Các API chấm công GPS Geofencing selfie, thi lý thuyết/thực hành và bàn giao thu hồi đồng phục nghỉ việc")
public class HrAttendanceController {

    private final AttendanceService attendanceService;
    private final ExamService examService;
    private final UniformAndResignationService uniformAndResignationService;

    // ==========================================
    // 1. CHẤM CÔNG GPS GEOFENCING & SELFIE
    // ==========================================

    @PostMapping("/attendance/check-in")
    @PreAuthorize("hasAnyRole('ROLE_EMPLOYEE', 'ROLE_KITCHEN_STAFF', 'ROLE_RESTAURANT_MANAGER', 'ROLE_BRANCH_ACCOUNTANT')")
    @Operation(summary = "Chấm công đầu ca (Check-in)", description = "Ghi nhận ảnh selfie và tọa độ GPS, kiểm tra Geofencing <= 100m")
    public ResponseEntity<ApiResponse<AttendanceResponse>> checkIn(
            @Valid @RequestBody CheckInRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        AttendanceResponse res = attendanceService.checkIn(request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Chấm công Check-in thành công", res));
    }

    @PostMapping("/attendance/check-out")
    @PreAuthorize("hasAnyRole('ROLE_EMPLOYEE', 'ROLE_KITCHEN_STAFF', 'ROLE_RESTAURANT_MANAGER', 'ROLE_BRANCH_ACCOUNTANT')")
    @Operation(summary = "Chấm công cuối ca (Check-out)", description = "Ghi nhận ảnh selfie và GPS lúc ra về, tự động tính số giờ làm thực tế")
    public ResponseEntity<ApiResponse<AttendanceResponse>> checkOut(
            @Valid @RequestBody CheckOutRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        AttendanceResponse res = attendanceService.checkOut(request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Chấm công Check-out thành công", res));
    }

    @GetMapping("/attendance/today")
    @PreAuthorize("hasAnyRole('ROLE_EMPLOYEE', 'ROLE_KITCHEN_STAFF', 'ROLE_RESTAURANT_MANAGER', 'ROLE_BRANCH_ACCOUNTANT', 'ROLE_GENERAL_ACCOUNTANT')")
    @Operation(summary = "Danh sách chấm công hôm nay", description = "Lấy danh sách các nhân viên đã chấm công hôm nay theo chi nhánh")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getTodayAttendances(
            @RequestParam(required = false) Long branchId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long targetBranchId = branchId != null ? branchId : currentUser.getBranchId();
        List<AttendanceResponse> list = attendanceService.getTodayAttendances(targetBranchId);
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách chấm công hôm nay thành công", list));
    }

    @GetMapping("/attendance/history")
    @PreAuthorize("hasAnyRole('ROLE_EMPLOYEE', 'ROLE_KITCHEN_STAFF', 'ROLE_RESTAURANT_MANAGER', 'ROLE_BRANCH_ACCOUNTANT', 'ROLE_GENERAL_ACCOUNTANT')")
    @Operation(summary = "Lịch sử chấm công của nhân viên", description = "Xem lịch sử chấm công cá nhân của tài khoản đăng nhập")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getMyAttendanceHistory(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<AttendanceResponse> list = attendanceService.getUserAttendanceHistory(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok("Lấy lịch sử chấm công thành công", list));
    }

    @GetMapping("/attendance/scan-abandonment")
    @PreAuthorize("hasAnyRole('ROLE_RESTAURANT_MANAGER', 'ROLE_BRANCH_ACCOUNTANT', 'ROLE_GENERAL_ACCOUNTANT')")
    @Operation(summary = "Tự động quét nhân viên vắng mặt 3 ngày liên tiếp", description = "Cảnh báo nguy cơ bỏ việc để quản lý xác nhận")
    public ResponseEntity<ApiResponse<AbandonmentScanResult>> scanAbandonment(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        AbandonmentScanResult result = attendanceService.scanSuspectedAbandonment(currentUser.getBranchId());
        return ResponseEntity.ok(ApiResponse.ok("Quét nguy cơ bỏ việc hoàn tất", result));
    }

    @PostMapping("/attendance/confirm-abandonment/{userId}")
    @PreAuthorize("hasAnyRole('ROLE_RESTAURANT_MANAGER', 'ROLE_GENERAL_ACCOUNTANT')")
    @Operation(summary = "Quản lý xác nhận nhân viên tự ý bỏ việc", description = "Khóa tài khoản và ghi nhận lương = 0 theo quy chế")
    public ResponseEntity<ApiResponse<ResignationRequest>> confirmAbandonment(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        ResignationRequest res = attendanceService.confirmAbandonment(userId, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Đã xác nhận nhân viên tự ý bỏ việc", res));
    }

    // ==========================================
    // 2. KỲ THI ĐỊNH KỲ TRỰC TUYẾN
    // ==========================================

    @GetMapping("/exams/questions")
    @PreAuthorize("hasAnyRole('ROLE_EMPLOYEE', 'ROLE_KITCHEN_STAFF', 'ROLE_RESTAURANT_MANAGER', 'ROLE_BRANCH_ACCOUNTANT')")
    @Operation(summary = "Lấy đề thi trắc nghiệm", description = "Đảo ngẫu nhiên câu hỏi theo vị trí chuyên môn (BEP / PHUC_VU)")
    public ResponseEntity<ApiResponse<List<ExamQuestionDto>>> getExamQuestions(
            @RequestParam(required = false, defaultValue = "BEP") String position) {
        List<ExamQuestionDto> questions = examService.getActiveQuestions(position);
        return ResponseEntity.ok(ApiResponse.ok("Tải đề thi trắc nghiệm thành công", questions));
    }

    @PostMapping("/exams/submit")
    @PreAuthorize("hasAnyRole('ROLE_EMPLOYEE', 'ROLE_KITCHEN_STAFF', 'ROLE_RESTAURANT_MANAGER', 'ROLE_BRANCH_ACCOUNTANT')")
    @Operation(summary = "Nộp bài thi trắc nghiệm lý thuyết", description = "Tự động chấm điểm theo đáp án chuẩn trên máy chủ")
    public ResponseEntity<ApiResponse<ExamSubmissionDto>> submitExam(
            @Valid @RequestBody ExamSubmitRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        ExamSubmissionDto submission = examService.submitExam(request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Nộp bài thi thành công", submission));
    }

    @GetMapping("/exams/submissions")
    @PreAuthorize("hasAnyRole('ROLE_RESTAURANT_MANAGER', 'ROLE_GENERAL_ACCOUNTANT')")
    @Operation(summary = "Danh sách bài thi của chi nhánh", description = "Dành cho Quản lý chi nhánh theo dõi và chấm thi thực hành")
    public ResponseEntity<ApiResponse<List<ExamSubmissionDto>>> getBranchSubmissions(
            @RequestParam(required = false) Long branchId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long targetBranchId = branchId != null ? branchId : (currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_GENERAL_ACCOUNTANT")) ? null : currentUser.getBranchId());
        List<ExamSubmissionDto> list = examService.getSubmissionsByBranch(targetBranchId);
        return ResponseEntity.ok(ApiResponse.ok("Tải danh sách bài thi thành công", list));
    }

    @GetMapping("/exams/my-submissions")
    @PreAuthorize("hasAnyRole('ROLE_EMPLOYEE', 'ROLE_KITCHEN_STAFF', 'ROLE_RESTAURANT_MANAGER', 'ROLE_BRANCH_ACCOUNTANT')")
    @Operation(summary = "Lịch sử bài thi của cá nhân", description = "Xem lại điểm lý thuyết và thực hành của chính mình")
    public ResponseEntity<ApiResponse<List<ExamSubmissionDto>>> getMySubmissions(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<ExamSubmissionDto> list = examService.getMySubmissions(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok("Tải bài thi của cá nhân thành công", list));
    }

    @PutMapping("/exams/submissions/{id}/grade-practical")
    @PreAuthorize("hasAnyRole('ROLE_RESTAURANT_MANAGER', 'ROLE_GENERAL_ACCOUNTANT')")
    @Operation(summary = "Chấm điểm phần thi thực hành", description = "Tính tổng điểm 40% Lý thuyết + 60% Thực hành (>= 70 điểm là ĐẠT)")
    public ResponseEntity<ApiResponse<ExamSubmissionDto>> gradePractical(
            @PathVariable Long id,
            @Valid @RequestBody GradePracticalRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        ExamSubmissionDto res = examService.gradePractical(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Chấm điểm thực hành thành công", res));
    }

    // ==========================================
    // 3. ĐỒNG PHỤC & BÀN GIAO NGHỈ VIỆC
    // ==========================================

    @GetMapping("/uniforms/items")
    @PreAuthorize("hasAnyRole('ROLE_EMPLOYEE', 'ROLE_KITCHEN_STAFF', 'ROLE_RESTAURANT_MANAGER', 'ROLE_BRANCH_ACCOUNTANT', 'ROLE_GENERAL_ACCOUNTANT')")
    @Operation(summary = "Danh mục loại đồng phục", description = "Liệt kê danh sách các loại đồng phục của chuỗi Sen Việt")
    public ResponseEntity<ApiResponse<List<UniformItem>>> getUniformItems() {
        List<UniformItem> items = uniformAndResignationService.getUniformItems();
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh mục đồng phục thành công", items));
    }

    @GetMapping("/uniforms/my-allocations")
    @PreAuthorize("hasAnyRole('ROLE_EMPLOYEE', 'ROLE_KITCHEN_STAFF', 'ROLE_RESTAURANT_MANAGER', 'ROLE_BRANCH_ACCOUNTANT')")
    @Operation(summary = "Danh sách đồng phục cá nhân đang giữ", description = "Xem các món đồng phục đã được cấp phát")
    public ResponseEntity<ApiResponse<List<UniformAllocationDto>>> getMyUniformAllocations(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<UniformAllocationDto> list = uniformAndResignationService.getUserUniformAllocations(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách đồng phục thành công", list));
    }

    @GetMapping("/uniforms/user-allocations/{userId}")
    @PreAuthorize("hasAnyRole('ROLE_RESTAURANT_MANAGER', 'ROLE_BRANCH_ACCOUNTANT', 'ROLE_GENERAL_ACCOUNTANT')")
    @Operation(summary = "Xem danh sách đồng phục cấp cho nhân viên bất kỳ", description = "Quản lý xem để chuẩn bị checklist thu hồi")
    public ResponseEntity<ApiResponse<List<UniformAllocationDto>>> getUserUniformAllocations(@PathVariable Long userId) {
        List<UniformAllocationDto> list = uniformAndResignationService.getUserUniformAllocations(userId);
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách đồng phục của nhân viên thành công", list));
    }

    @GetMapping("/resignations")
    @PreAuthorize("hasAnyRole('ROLE_RESTAURANT_MANAGER', 'ROLE_BRANCH_ACCOUNTANT', 'ROLE_GENERAL_ACCOUNTANT')")
    @Operation(summary = "Danh sách đơn xin nghỉ việc", description = "Quản lý và Kế toán theo dõi tiến độ thu hồi đồng phục và duyệt nghỉ việc")
    public ResponseEntity<ApiResponse<List<ResignationRequest>>> getResignationRequests(
            @RequestParam(required = false) Long branchId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long targetBranchId = branchId != null ? branchId : (currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_GENERAL_ACCOUNTANT")) ? null : currentUser.getBranchId());
        List<ResignationRequest> list = uniformAndResignationService.getResignationRequests(targetBranchId);
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách đơn nghỉ việc thành công", list));
    }

    @GetMapping("/resignations/my")
    @PreAuthorize("hasAnyRole('ROLE_EMPLOYEE', 'ROLE_KITCHEN_STAFF', 'ROLE_RESTAURANT_MANAGER', 'ROLE_BRANCH_ACCOUNTANT')")
    @Operation(summary = "Đơn nghỉ việc của cá nhân", description = "Xem tình trạng xử lý đơn nghỉ việc của mình")
    public ResponseEntity<ApiResponse<List<ResignationRequest>>> getMyResignations(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<ResignationRequest> list = uniformAndResignationService.getMyResignations(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok("Lấy đơn nghỉ việc cá nhân thành công", list));
    }

    @PostMapping("/resignations/submit")
    @PreAuthorize("hasAnyRole('ROLE_EMPLOYEE', 'ROLE_KITCHEN_STAFF', 'ROLE_RESTAURANT_MANAGER', 'ROLE_BRANCH_ACCOUNTANT')")
    @Operation(summary = "Nhân viên nộp đơn xin nghỉ việc", description = "Bắt đầu quy trình bàn giao đồng phục trước khi thanh toán lương")
    public ResponseEntity<ApiResponse<ResignationRequest>> submitResignation(
            @RequestParam(required = false) String reason,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        ResignationRequest res = uniformAndResignationService.submitResignation(currentUser.getId(), reason);
        return ResponseEntity.ok(ApiResponse.ok("Nộp đơn xin nghỉ việc thành công", res));
    }

    @PutMapping("/resignations/{id}/checklist")
    @PreAuthorize("hasAnyRole('ROLE_RESTAURANT_MANAGER', 'ROLE_GENERAL_ACCOUNTANT')")
    @Operation(summary = "Xác nhận checklist thu hồi đồng phục", description = "Nếu thiếu đồ -> DANG_GIU_LUONG; Nếu đủ 100% -> HOAN_TAT")
    public ResponseEntity<ApiResponse<ResignationRequest>> verifyChecklist(
            @PathVariable Long id,
            @Valid @RequestBody UniformReturnRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        ResignationRequest res = uniformAndResignationService.verifyUniformReturnChecklist(id, request, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok("Xác nhận bàn giao đồng phục thành công", res));
    }
}
