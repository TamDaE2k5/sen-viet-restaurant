package com.senviet;

import com.senviet.domain.dto.request.CreateSupplierRequest;
import com.senviet.domain.dto.request.UpdateSupplierRequest;
import com.senviet.domain.dto.response.SupplierResponse;
import com.senviet.domain.entity.Supplier;
import com.senviet.domain.repository.SupplierRepository;
import com.senviet.exception.ApiException;
import com.senviet.service.SupplierService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Kiểm thử đơn vị (Unit Tests) cho Quản lý Nhà Cung Cấp (SupplierService).
 */
@ExtendWith(MockitoExtension.class)
class SupplierServiceTest {

    @Mock
    private SupplierRepository supplierRepository;

    @InjectMocks
    private SupplierService supplierService;

    @Test
    @DisplayName("Thêm mới nhà cung cấp thành công khi mã chưa tồn tại")
    void testCreateSupplierSuccess() {
        when(supplierRepository.existsBySupplierCode("NCC-TEST01")).thenReturn(false);
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(invocation -> {
            Supplier s = invocation.getArgument(0);
            s.setId(100L);
            return s;
        });

        CreateSupplierRequest request = CreateSupplierRequest.builder()
                .supplierCode("NCC-TEST01")
                .supplierName("Công Ty TNHH Hải Sản Biển Đông")
                .phone("0988776655")
                .address("Hải Phòng")
                .build();

        SupplierResponse response = supplierService.createSupplier(request);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(100L);
        assertThat(response.getSupplierCode()).isEqualTo("NCC-TEST01");
        assertThat(response.getSupplierName()).isEqualTo("Công Ty TNHH Hải Sản Biển Đông");
        assertThat(response.getStatus()).isEqualTo("HOAT_DONG");
    }

    @Test
    @DisplayName("Chặn tạo nhà cung cấp nếu mã nhà cung cấp đã tồn tại (Conflict 409)")
    void testCreateSupplierDuplicateCodeThrowsException() {
        when(supplierRepository.existsBySupplierCode("NCC-DUPLICATE")).thenReturn(true);

        CreateSupplierRequest request = CreateSupplierRequest.builder()
                .supplierCode("NCC-DUPLICATE")
                .supplierName("Tên NCC Trùng")
                .build();

        assertThatThrownBy(() -> supplierService.createSupplier(request))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Mã nhà cung cấp đã tồn tại");
    }

    @Test
    @DisplayName("Cập nhật thông tin nhà cung cấp thành công")
    void testUpdateSupplierSuccess() {
        Supplier existing = Supplier.builder()
                .id(50L)
                .supplierCode("NCC-50")
                .supplierName("Tên Cũ")
                .phone("0911")
                .status("HOAT_DONG")
                .build();
        when(supplierRepository.findById(50L)).thenReturn(Optional.of(existing));
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateSupplierRequest request = UpdateSupplierRequest.builder()
                .supplierName("Tên Mới Cập Nhật")
                .phone("0922")
                .build();

        SupplierResponse response = supplierService.updateSupplier(50L, request);

        assertThat(response).isNotNull();
        assertThat(response.getSupplierName()).isEqualTo("Tên Mới Cập Nhật");
        assertThat(response.getPhone()).isEqualTo("0922");
    }
}
