package com.senviet.service;

import com.senviet.domain.dto.request.CreateSupplierRequest;
import com.senviet.domain.dto.request.UpdateSupplierRequest;
import com.senviet.domain.dto.response.SupplierResponse;
import com.senviet.domain.entity.Supplier;
import com.senviet.domain.repository.SupplierRepository;
import com.senviet.exception.ApiException;
import com.senviet.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service Quản lý Nhà Cung Cấp (Suppliers).
 * Cung cấp các thao tác thêm mới, tra cứu, cập nhật thông tin đối tác cung cấp nguyên vật liệu.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SupplierService {

    private final SupplierRepository supplierRepository;

    /**
     * Tra cứu danh sách nhà cung cấp theo từ khóa tìm kiếm và trạng thái.
     *
     * @param keyword Từ khóa tìm kiếm (mã, tên, số điện thoại)
     * @param status  Trạng thái hoạt động (HOAT_DONG, NGUNG_HOAT_DONG)
     * @return Danh sách DTO SupplierResponse
     */
    @Transactional(readOnly = true)
    public List<SupplierResponse> getSuppliers(String keyword, String status) {
        String trimmedKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        String trimmedStatus = (status != null && !status.trim().isEmpty()) ? status.trim() : null;

        List<Supplier> suppliers;
        if (trimmedKeyword != null) {
            suppliers = supplierRepository.searchSuppliersWithKeyword(trimmedKeyword, trimmedStatus);
        } else if (trimmedStatus != null) {
            suppliers = supplierRepository.findByStatusOrderBySupplierNameAsc(trimmedStatus);
        } else {
            suppliers = supplierRepository.findAll(Sort.by(Sort.Direction.ASC, "supplierName"));
        }

        return suppliers.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lấy thông tin chi tiết nhà cung cấp theo ID.
     *
     * @param id ID của nhà cung cấp
     * @return DTO SupplierResponse
     */
    @Transactional(readOnly = true)
    public SupplierResponse getSupplierById(Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", id));
        return mapToResponse(supplier);
    }

    /**
     * Tạo mới nhà cung cấp. Kiểm tra trùng lặp mã nhà cung cấp.
     *
     * @param request DTO CreateSupplierRequest
     * @return DTO SupplierResponse vừa tạo
     */
    @Transactional
    public SupplierResponse createSupplier(CreateSupplierRequest request) {
        String code = request.getSupplierCode().trim().toUpperCase();
        if (supplierRepository.existsBySupplierCode(code)) {
            throw new ApiException(HttpStatus.CONFLICT, "Mã nhà cung cấp đã tồn tại: " + code);
        }

        Supplier supplier = Supplier.builder()
                .supplierCode(code)
                .supplierName(request.getSupplierName().trim())
                .phone(request.getPhone() != null ? request.getPhone().trim() : null)
                .address(request.getAddress() != null ? request.getAddress().trim() : null)
                .contactPerson(request.getContactPerson() != null ? request.getContactPerson().trim() : null)
                .email(request.getEmail() != null ? request.getEmail().trim() : null)
                .taxCode(request.getTaxCode() != null ? request.getTaxCode().trim() : null)
                .status(request.getStatus() != null && !request.getStatus().trim().isEmpty() ? request.getStatus().trim() : "HOAT_DONG")
                .build();

        Supplier saved = supplierRepository.save(supplier);
        log.info("Tạo mới nhà cung cấp: {} - {}", saved.getSupplierCode(), saved.getSupplierName());
        return mapToResponse(saved);
    }

    /**
     * Cập nhật thông tin nhà cung cấp.
     *
     * @param id      ID nhà cung cấp cần sửa
     * @param request DTO UpdateSupplierRequest
     * @return DTO SupplierResponse sau cập nhật
     */
    @Transactional
    public SupplierResponse updateSupplier(Long id, UpdateSupplierRequest request) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", id));

        if (request.getSupplierName() != null && !request.getSupplierName().trim().isEmpty()) {
            supplier.setSupplierName(request.getSupplierName().trim());
        }
        if (request.getPhone() != null) {
            supplier.setPhone(request.getPhone().trim());
        }
        if (request.getAddress() != null) {
            supplier.setAddress(request.getAddress().trim());
        }
        if (request.getContactPerson() != null) {
            supplier.setContactPerson(request.getContactPerson().trim());
        }
        if (request.getEmail() != null) {
            supplier.setEmail(request.getEmail().trim());
        }
        if (request.getTaxCode() != null) {
            supplier.setTaxCode(request.getTaxCode().trim());
        }
        if (request.getStatus() != null && !request.getStatus().trim().isEmpty()) {
            supplier.setStatus(request.getStatus().trim());
        }

        Supplier updated = supplierRepository.save(supplier);
        log.info("Cập nhật nhà cung cấp: {} - {}", updated.getSupplierCode(), updated.getSupplierName());
        return mapToResponse(updated);
    }

    public SupplierResponse mapToResponse(Supplier s) {
        return SupplierResponse.builder()
                .id(s.getId())
                .supplierCode(s.getSupplierCode())
                .supplierName(s.getSupplierName())
                .phone(s.getPhone())
                .address(s.getAddress())
                .contactPerson(s.getContactPerson())
                .email(s.getEmail())
                .taxCode(s.getTaxCode())
                .status(s.getStatus())
                .createdAt(s.getCreatedAt())
                .build();
    }
}
