package com.senviet.service;

import com.senviet.domain.dto.request.CreateInventoryCheckRequest;
import com.senviet.domain.dto.request.InventoryCheckItemRequest;
import com.senviet.domain.dto.response.InventoryCheckItemResponse;
import com.senviet.domain.dto.response.InventoryCheckResponse;
import com.senviet.domain.entity.*;
import com.senviet.domain.repository.*;
import com.senviet.exception.ApiException;
import com.senviet.exception.ResourceNotFoundException;
import com.senviet.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service Xử lý Biên Bản Kiểm Kê Kho Đầu Ca / Cuối Ca.
 * 
 * Nghiệp vụ:
 * 1. Tự động đối soát tồn thực tế so với tồn hệ thống: Difference = Actual - System.
 * 2. Bắt buộc nhập lý do chênh lệch khi Actual != System.
 * 3. Đồng bộ số liệu kiểm kê thực tế vào tồn kho và Snapshot đối soát cuối ngày (I.5).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryCheckService {

    private final InventoryCheckRepository inventoryCheckRepository;
    private final InventoryCheckItemRepository inventoryCheckItemRepository;
    private final InventoryStockRepository inventoryStockRepository;
    private final ImportBatchRepository importBatchRepository;
    private final ItemRepository itemRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final InventorySnapshotRepository inventorySnapshotRepository;

    /**
     * Tạo mới biên bản kiểm kê kho.
     *
     * @param request     DTO CreateInventoryCheckRequest
     * @param currentUser Người dùng thực hiện kiểm kê
     * @return DTO InventoryCheckResponse
     */
    @Transactional
    public InventoryCheckResponse createInventoryCheck(CreateInventoryCheckRequest request, UserPrincipal currentUser) {
        Long branchId = request.getBranchId() != null ? request.getBranchId() : currentUser.getBranchId();
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Branch", "id", branchId));

        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUser.getId()));

        String shift = (request.getShift() != null && !request.getShift().trim().isEmpty())
                ? request.getShift().trim().toUpperCase() : "CA_NGAY";

        LocalDate checkDate = request.getCheckDate() != null ? request.getCheckDate() : LocalDate.now();

        String checkCode = generateCheckCode(checkDate);

        InventoryCheck check = InventoryCheck.builder()
                .checkCode(checkCode)
                .branch(branch)
                .shift(shift)
                .checkDate(checkDate)
                .checkedByUser(user)
                .status("HOAN_THANH")
                .note(request.getNote())
                .build();

        InventoryCheck savedCheck = inventoryCheckRepository.save(check);

        List<InventoryCheckItem> items = new ArrayList<>();

        for (InventoryCheckItemRequest itemReq : request.getItems()) {
            Item item = itemRepository.findById(itemReq.getItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Item", "id", itemReq.getItemId()));

            ImportBatch batch = null;
            if (itemReq.getBatchId() != null) {
                batch = importBatchRepository.findById(itemReq.getBatchId()).orElse(null);
            }

            BigDecimal systemStock = itemReq.getSystemStock();
            if (systemStock == null) {
                if (batch != null) {
                    systemStock = batch.getCurrentStock();
                } else {
                    systemStock = inventoryStockRepository.getTotalStockByBranchAndItem(branch.getId(), item.getId());
                }
            }

            BigDecimal actualStock = itemReq.getActualStock();
            BigDecimal diff = actualStock.subtract(systemStock);

            // Bắt buộc nhập lý do khi chênh lệch
            if (diff.compareTo(BigDecimal.ZERO) != 0) {
                if (itemReq.getReason() == null || itemReq.getReason().trim().isEmpty()) {
                    throw new ApiException(HttpStatus.BAD_REQUEST,
                            String.format("Bắt buộc ghi nhận lý do chênh lệch tồn cho mặt hàng '%s' (Hệ thống: %s, Thực tế: %s, Lệch: %s %s)",
                                    item.getItemName(), systemStock, actualStock, diff, item.getUnit()));
                }
            }

            InventoryCheckItem checkItem = InventoryCheckItem.builder()
                    .inventoryCheck(savedCheck)
                    .item(item)
                    .batch(batch)
                    .systemStock(systemStock)
                    .actualStock(actualStock)
                    .difference(diff)
                    .reason(itemReq.getReason() != null ? itemReq.getReason().trim() : null)
                    .build();

            items.add(inventoryCheckItemRepository.save(checkItem));

            // Cập nhật tồn kho theo số lượng kiểm kê thực tế
            if (batch != null) {
                batch.setCurrentStock(actualStock);
                if (actualStock.compareTo(BigDecimal.ZERO) <= 0) {
                    batch.setStatus("HET_HANG");
                } else {
                    batch.setStatus("CON_HANG");
                }
                importBatchRepository.save(batch);

                inventoryStockRepository.findByBranchIdAndItemIdAndBatchId(branch.getId(), item.getId(), batch.getId())
                        .ifPresent(st -> {
                            st.setQuantity(actualStock);
                            st.setLastUpdatedAt(Instant.now());
                            inventoryStockRepository.save(st);
                        });
            }

            // Đồng bộ snapshot phục vụ đối soát cuối ngày (Task 7.4 / I.5)
            syncInventorySnapshot(branch, item, checkDate, shift, actualStock, user, itemReq.getReason());
        }

        savedCheck.getItems().clear();
        savedCheck.getItems().addAll(items);
        log.info("Lập biên bản kiểm kê kho {} cho chi nhánh {} ca {}, ghi nhận {} mặt hàng",
                savedCheck.getCheckCode(), branch.getBranchCode(), shift, items.size());

        return mapToResponse(savedCheck);
    }

    /**
     * Tra cứu danh sách biên bản kiểm kê theo chi nhánh, ngày và ca.
     */
    @Transactional(readOnly = true)
    public List<InventoryCheckResponse> getInventoryChecks(Long branchId, LocalDate checkDate, String shift) {
        String trimmedShift = (shift != null && !shift.trim().isEmpty()) ? shift.trim().toUpperCase() : null;
        return inventoryCheckRepository.searchChecks(branchId, checkDate, trimmedShift).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lấy chi tiết biên bản kiểm kê theo ID.
     */
    @Transactional(readOnly = true)
    public InventoryCheckResponse getInventoryCheckById(Long id) {
        InventoryCheck check = inventoryCheckRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryCheck", "id", id));
        return mapToResponse(check);
    }

    private void syncInventorySnapshot(Branch branch, Item item, LocalDate date, String shift, BigDecimal closingStock, User user, String note) {
        InventorySnapshot snapshot = inventorySnapshotRepository
                .findFirstByBranchIdAndItemIdAndSnapshotDateAndShiftType(branch.getId(), item.getId(), date, shift)
                .orElse(InventorySnapshot.builder()
                        .branch(branch)
                        .item(item)
                        .snapshotDate(date)
                        .shiftType(shift)
                        .unit(item.getUnit())
                        .openingStock(BigDecimal.ZERO)
                        .inStock(BigDecimal.ZERO)
                        .build());

        snapshot.setClosingStock(closingStock);
        snapshot.setCheckedByUser(user);
        if (note != null && !note.trim().isEmpty()) {
            snapshot.setNote(note.trim());
        }
        inventorySnapshotRepository.save(snapshot);
    }

    private String generateCheckCode(LocalDate checkDate) {
        String dateStr = checkDate.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String prefix = "KK-" + dateStr + "-";
        long count = inventoryCheckRepository.countByCheckCodeStartingWith(prefix) + 1;
        String code = String.format("%s%03d", prefix, count);
        while (inventoryCheckRepository.findByCheckCode(code).isPresent()) {
            count++;
            code = String.format("%s%03d", prefix, count);
        }
        return code;
    }

    private InventoryCheckResponse mapToResponse(InventoryCheck c) {
        List<InventoryCheckItemResponse> items = (c.getItems() != null) ?
                c.getItems().stream().map(it -> InventoryCheckItemResponse.builder()
                        .id(it.getId())
                        .itemId(it.getItem().getId())
                        .itemCode(it.getItem().getItemCode())
                        .itemName(it.getItem().getItemName())
                        .batchId(it.getBatch() != null ? it.getBatch().getId() : null)
                        .batchCode(it.getBatch() != null ? it.getBatch().getBatchCode() : null)
                        .systemStock(it.getSystemStock())
                        .actualStock(it.getActualStock())
                        .difference(it.getDifference())
                        .reason(it.getReason())
                        .unit(it.getItem().getUnit())
                        .build()).collect(Collectors.toList()) :
                Collections.emptyList();

        return InventoryCheckResponse.builder()
                .id(c.getId())
                .checkCode(c.getCheckCode())
                .branchId(c.getBranch().getId())
                .branchName(c.getBranch().getBranchName())
                .shift(c.getShift())
                .checkDate(c.getCheckDate())
                .checkedById(c.getCheckedByUser() != null ? c.getCheckedByUser().getId() : null)
                .checkedByName(c.getCheckedByUser() != null ? c.getCheckedByUser().getFullName() : null)
                .status(c.getStatus())
                .note(c.getNote())
                .createdAt(c.getCreatedAt())
                .items(items)
                .build();
    }
}
