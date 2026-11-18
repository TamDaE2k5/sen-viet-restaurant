package com.senviet.service;

import com.senviet.domain.dto.request.UniformReturnRequest;
import com.senviet.domain.dto.response.UniformAllocationDto;
import com.senviet.domain.entity.ResignationRequest;
import com.senviet.domain.entity.UniformAllocation;
import com.senviet.domain.entity.UniformItem;
import com.senviet.domain.entity.User;
import com.senviet.domain.repository.ResignationRequestRepository;
import com.senviet.domain.repository.UniformAllocationRepository;
import com.senviet.domain.repository.UniformItemRepository;
import com.senviet.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service quản lý cấp phát đồng phục, bàn giao thu hồi và xét duyệt đơn xin nghỉ việc.
 * 
 * Nghiệp vụ cốt lõi:
 * - Khi nhân viên nghỉ việc, bắt buộc phải trả lại 100% đồng phục đã cấp.
 * - Nếu thiếu dù chỉ 1 món, hệ thống tự động gắn trạng thái 'DANG_GIU_LUONG'
 *   để kế toán khóa thanh toán đợt lương cuối.
 * - Chỉ khi quản lý xác nhận đã thu hồi toàn bộ, đơn mới chuyển thành 'HOAN_TAT'
 *   để mở khóa trả lương.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UniformAndResignationService {

    private final UniformItemRepository uniformItemRepository;
    private final UniformAllocationRepository uniformAllocationRepository;
    private final ResignationRequestRepository resignationRequestRepository;
    private final UserRepository userRepository;

    /**
     * Lấy danh mục tất cả các loại đồng phục của hệ thống.
     */
    @Transactional(readOnly = true)
    public List<UniformItem> getUniformItems() {
        return uniformItemRepository.findAll();
    }

    /**
     * Lấy danh sách đồng phục đã cấp cho một nhân viên cụ thể.
     */
    @Transactional(readOnly = true)
    public List<UniformAllocationDto> getUserUniformAllocations(Long userId) {
        return uniformAllocationRepository.findByUserId(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách đơn xin nghỉ việc của chi nhánh.
     */
    @Transactional(readOnly = true)
    public List<ResignationRequest> getResignationRequests(Long branchId) {
        if (branchId != null) {
            return resignationRequestRepository.findByBranchIdOrderByRequestDateDesc(branchId);
        }
        return resignationRequestRepository.findAll();
    }

    /**
     * Lấy danh sách đơn xin nghỉ việc của chính nhân viên.
     */
    @Transactional(readOnly = true)
    public List<ResignationRequest> getMyResignations(Long userId) {
        return resignationRequestRepository.findByUserId(userId);
    }

    /**
     * Nhân viên nộp đơn xin nghỉ việc.
     */
    @Transactional
    public ResignationRequest submitResignation(Long userId, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thông tin nhân viên ID: " + userId));

        ResignationRequest request = ResignationRequest.builder()
                .user(user)
                .branch(user.getBranch())
                .requestDate(LocalDate.now())
                .reason(reason != null ? reason : "Nguyện vọng cá nhân")
                .isAbandoned(false)
                .status("CHO_DUYET")
                .createdAt(Instant.now())
                .build();

        log.info("Nhân viên {} đã nộp đơn xin nghỉ việc tại chi nhánh {}", user.getFullName(), user.getBranch().getBranchName());
        return resignationRequestRepository.save(request);
    }

    /**
     * Quản lý thực hiện kiểm đếm checklist thu hồi đồng phục và duyệt bàn giao.
     * 
     * Ràng buộc:
     * - Cập nhật trạng thái đã thu hồi cho các món được tick chọn.
     * - Kiểm tra xem nhân viên còn nợ món nào chưa hoàn trả hay không.
     * - Nếu còn nợ -> DANG_GIU_LUONG (liệt kê rõ tên các món thiếu).
     * - Nếu đã trả đủ 100% -> HOAN_TAT (mở khóa trả lương).
     */
    @Transactional
    public ResignationRequest verifyUniformReturnChecklist(Long resignationId, UniformReturnRequest request, Long managerUserId) {
        ResignationRequest resignation = resignationRequestRepository.findById(resignationId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn nghỉ việc ID: " + resignationId));

        User manager = userRepository.findById(managerUserId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy quản lý ID: " + managerUserId));

        User employee = resignation.getUser();

        // 1. Cập nhật các món đã được tích nhận lại
        if (request.getReturnedAllocationIds() != null && !request.getReturnedAllocationIds().isEmpty()) {
            List<UniformAllocation> allocations = uniformAllocationRepository.findAllById(request.getReturnedAllocationIds());
            for (UniformAllocation alloc : allocations) {
                if (alloc.getUser().getId().equals(employee.getId())) {
                    alloc.setIsReturned(true);
                    alloc.setReturnedDate(LocalDate.now());
                    alloc.setReceivedByUser(manager);
                    uniformAllocationRepository.save(alloc);
                }
            }
        }

        // 2. Kiểm tra các món đồng phục còn chưa trả của nhân viên này
        List<UniformAllocation> unreturned = uniformAllocationRepository.findByUserIdAndIsReturnedFalse(employee.getId());

        resignation.setApprovedByUser(manager);
        resignation.setApprovedAt(Instant.now());
        resignation.setManagerNote(request.getManagerNote());

        if (!unreturned.isEmpty()) {
            // Còn thiếu đồng phục -> Khóa lương
            String missingItems = unreturned.stream()
                    .map(a -> a.getUniformItem().getItemName())
                    .distinct()
                    .collect(Collectors.joining(", "));

            resignation.setStatus("DANG_GIU_LUONG");
            resignation.setMissingUniformDetails("Chưa hoàn trả: " + missingItems);
            log.warn("Đơn nghỉ việc #{} của {} chuyển trạng thái DANG_GIU_LUONG do thiếu: {}",
                    resignation.getId(), employee.getFullName(), missingItems);
        } else {
            // Đã trả đầy đủ 100% -> Mở khóa
            resignation.setStatus("HOAN_TAT");
            resignation.setMissingUniformDetails("Đã hoàn trả đủ 100% đồng phục");
            log.info("Đơn nghỉ việc #{} của {} đã hoàn tất bàn giao 100% đồng phục",
                    resignation.getId(), employee.getFullName());
        }

        return resignationRequestRepository.save(resignation);
    }

    private UniformAllocationDto mapToDto(UniformAllocation allocation) {
        return UniformAllocationDto.builder()
                .id(allocation.getId())
                .uniformItemId(allocation.getUniformItem().getId())
                .uniformItemName(allocation.getUniformItem().getItemName())
                .depositValue(allocation.getUniformItem().getDepositValue())
                .allocatedDate(allocation.getAllocatedDate())
                .isReturned(allocation.getIsReturned())
                .returnedDate(allocation.getReturnedDate())
                .note(allocation.getNote())
                .build();
    }
}
