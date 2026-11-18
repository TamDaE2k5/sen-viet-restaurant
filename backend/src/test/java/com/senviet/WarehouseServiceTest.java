package com.senviet;

import com.senviet.domain.dto.request.CreateWarehouseDocumentRequest;
import com.senviet.domain.dto.request.DamageReportRequest;
import com.senviet.domain.dto.request.WarehouseDocumentItemRequest;
import com.senviet.domain.dto.response.ImportBatchResponse;
import com.senviet.domain.dto.response.SupplierLossResponse;
import com.senviet.domain.dto.response.WarehouseDocumentItemResponse;
import com.senviet.domain.dto.response.WarehouseDocumentResponse;
import com.senviet.domain.entity.*;
import com.senviet.domain.repository.*;
import com.senviet.exception.ApiException;
import com.senviet.security.UserPrincipal;
import com.senviet.service.KitchenService;
import com.senviet.service.WarehouseService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Kiểm thử đơn vị (Unit Tests) cho Phân hệ Quản lý Kho, Lô nhập & Báo cáo Nhà cung cấp.
 * Tuân thủ tiêu chí nghiệm thu Phase 7 (Acceptance Criteria 1, 2, 4).
 */
@ExtendWith(MockitoExtension.class)
class WarehouseServiceTest {

    @Mock
    private WarehouseDocumentRepository documentRepository;
    @Mock
    private WarehouseDocumentItemRepository documentItemRepository;
    @Mock
    private ImportBatchRepository importBatchRepository;
    @Mock
    private InventoryStockRepository inventoryStockRepository;
    @Mock
    private SupplierRepository supplierRepository;
    @Mock
    private ItemRepository itemRepository;
    @Mock
    private RecipeRepository recipeRepository;
    @Mock
    private RecipeIngredientRepository recipeIngredientRepository;
    @Mock
    private BranchRepository branchRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private DamageReportRepository damageReportRepository;

    @InjectMocks
    private WarehouseService warehouseService;

    private Branch branch;
    private User user;
    private UserPrincipal userPrincipal;
    private Supplier supplier;
    private Item itemCua;

    @BeforeEach
    void setUp() {
        branch = Branch.builder().id(1L).branchCode("CN_THAI_NGUYEN").branchName("Chi nhánh Thái Nguyên").build();
        user = User.builder().id(10L).username("bep_tn").fullName("Nguyễn Văn Bếp").build();
        userPrincipal = UserPrincipal.builder()
                .id(10L)
                .username("bep_tn")
                .fullName("Nguyễn Văn Bếp")
                .branchId(1L)
                .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_KITCHEN_STAFF")))
                .active(true)
                .build();

        supplier = Supplier.builder()
                .id(100L)
                .supplierCode("NCC-QN01")
                .supplierName("Hải Sản Quảng Ninh")
                .phone("0912345678")
                .build();

        itemCua = Item.builder()
                .id(200L)
                .itemCode("CUA_CA_MAU")
                .itemName("Cua Cà Mau (Tươi sống)")
                .unit("KG")
                .costPrice(new BigDecimal("350000.00"))
                .build();
    }

    @Test
    @DisplayName("Tiêu chí 1: Tạo phiếu nhập 100kg Cua Cà Mau từ NCC Quảng Ninh -> Tự sinh lô LOT-YYYYMM-001 và cộng 100kg tồn")
    void testCreateGoodsReceiptDocumentAndAutoGenerateLot() {
        // Giả lập tìm kiếm chi nhánh, user, NCC, item
        when(branchRepository.findById(1L)).thenReturn(Optional.of(branch));
        when(userRepository.findById(10L)).thenReturn(Optional.of(user));
        when(supplierRepository.findById(100L)).thenReturn(Optional.of(supplier));
        when(itemRepository.findById(200L)).thenReturn(Optional.of(itemCua));

        when(documentRepository.countByDocCodeStartingWith(anyString())).thenReturn(0L);
        when(documentRepository.findByDocCode(anyString())).thenReturn(Optional.empty());
        when(documentRepository.save(any(WarehouseDocument.class))).thenAnswer(invocation -> invocation.getArgument(0));

        when(importBatchRepository.countByBatchCodeStartingWith(anyString())).thenReturn(0L);
        when(importBatchRepository.existsByBatchCode(anyString())).thenReturn(false);
        when(importBatchRepository.save(any(ImportBatch.class))).thenAnswer(invocation -> {
            ImportBatch b = invocation.getArgument(0);
            b.setId(500L);
            return b;
        });

        when(inventoryStockRepository.findByBranchIdAndItemIdAndBatchId(eq(1L), eq(200L), any()))
                .thenReturn(Optional.empty());
        when(inventoryStockRepository.save(any(InventoryStock.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(documentItemRepository.save(any(WarehouseDocumentItem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Chuẩn bị request nhập kho 100 kg Cua Cà Mau
        WarehouseDocumentItemRequest itemReq = WarehouseDocumentItemRequest.builder()
                .itemId(200L)
                .quantity(new BigDecimal("100.000"))
                .unitPrice(new BigDecimal("350000.00"))
                .note("Nhập tươi sống đợt sáng")
                .build();

        CreateWarehouseDocumentRequest request = CreateWarehouseDocumentRequest.builder()
                .branchId(1L)
                .docType("NHAP")
                .supplierId(100L)
                .note("Phiếu nhập hải sản sáng")
                .items(Collections.singletonList(itemReq))
                .build();

        WarehouseDocumentResponse response = warehouseService.createDocument(request, userPrincipal);

        // Kiểm tra kết quả
        assertThat(response).isNotNull();
        assertThat(response.getDocType()).isEqualTo("NHAP");
        assertThat(response.getSupplierName()).isEqualTo("Hải Sản Quảng Ninh");
        assertThat(response.getTotalAmount()).isEqualByComparingTo(new BigDecimal("35000000.00")); // 100 * 350.000
        assertThat(response.getItems()).hasSize(1);

        WarehouseDocumentItemResponse itemResp = response.getItems().get(0);
        assertThat(itemResp.getQuantity()).isEqualByComparingTo(new BigDecimal("100.000"));

        String expectedPrefix = "LOT-" + YearMonth.now().format(DateTimeFormatter.ofPattern("yyyyMM")) + "-";
        assertThat(itemResp.getBatchCode()).startsWith(expectedPrefix);
        assertThat(itemResp.getBatchCode()).endsWith("001");

        // Verify ImportBatch được lưu với số lượng 100 kg
        verify(importBatchRepository, times(1)).save(argThat(batch ->
                batch.getInitialQuantity().compareTo(new BigDecimal("100.000")) == 0 &&
                batch.getCurrentStock().compareTo(new BigDecimal("100.000")) == 0 &&
                batch.getSupplier().getSupplierCode().equals("NCC-QN01")
        ));

        // Verify InventoryStock được cộng 100 kg
        verify(inventoryStockRepository, times(1)).save(argThat(stock ->
                stock.getQuantity().compareTo(new BigDecimal("100.000")) == 0
        ));
    }

    @Test
    @DisplayName("Xuất chuyển kho có chỉ định lô: Trừ tồn chính xác và chặn nếu xuất vượt tồn")
    void testDispatchDocumentDeductsBatchStock() {
        when(branchRepository.findById(1L)).thenReturn(Optional.of(branch));
        when(userRepository.findById(10L)).thenReturn(Optional.of(user));
        when(itemRepository.findById(200L)).thenReturn(Optional.of(itemCua));

        ImportBatch existingBatch = ImportBatch.builder()
                .id(501L)
                .batchCode("LOT-202611-001")
                .supplier(supplier)
                .item(itemCua)
                .branch(branch)
                .importDate(LocalDate.now())
                .initialQuantity(new BigDecimal("100.000"))
                .currentStock(new BigDecimal("20.000"))
                .unitPrice(new BigDecimal("350000.00"))
                .status("CON_HANG")
                .build();

        when(importBatchRepository.findById(501L)).thenReturn(Optional.of(existingBatch));

        // Trường hợp 1: Xuất 25kg trong khi tồn chỉ còn 20kg -> Ném ngoại lệ
        WarehouseDocumentItemRequest overItemReq = WarehouseDocumentItemRequest.builder()
                .itemId(200L)
                .batchId(501L)
                .quantity(new BigDecimal("25.000"))
                .build();

        CreateWarehouseDocumentRequest overReq = CreateWarehouseDocumentRequest.builder()
                .branchId(1L)
                .docType("XUAT_CHUYEN")
                .items(Collections.singletonList(overItemReq))
                .build();

        assertThatThrownBy(() -> warehouseService.createDocument(overReq, userPrincipal))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("vượt quá tồn hiện tại của lô");

        // Trường hợp 2: Xuất đúng 20kg -> Lô về 0kg và chuyển trạng thái HET_HANG
        when(documentRepository.countByDocCodeStartingWith(anyString())).thenReturn(0L);
        when(documentRepository.findByDocCode(anyString())).thenReturn(Optional.empty());
        when(documentRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(documentItemRepository.save(any(WarehouseDocumentItem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        InventoryStock existingStock = InventoryStock.builder()
                .branch(branch)
                .item(itemCua)
                .batch(existingBatch)
                .quantity(new BigDecimal("20.000"))
                .build();
        when(inventoryStockRepository.findByBranchIdAndItemIdAndBatchId(1L, 200L, 501L))
                .thenReturn(Optional.of(existingStock));

        WarehouseDocumentItemRequest validReq = WarehouseDocumentItemRequest.builder()
                .itemId(200L)
                .batchId(501L)
                .quantity(new BigDecimal("20.000"))
                .build();

        CreateWarehouseDocumentRequest dispatchReq = CreateWarehouseDocumentRequest.builder()
                .branchId(1L)
                .docType("XUAT_CHUYEN")
                .items(Collections.singletonList(validReq))
                .build();

        WarehouseDocumentResponse dispatchResp = warehouseService.createDocument(dispatchReq, userPrincipal);
        assertThat(dispatchResp).isNotNull();
        assertThat(existingBatch.getCurrentStock()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(existingBatch.getStatus()).isEqualTo("HET_HANG");
    }

    @Test
    @DisplayName("Tiêu chí 4: Báo cáo tỷ lệ hỏng theo NCC tính % Hỏng = (Kg hỏng / Kg nhập) * 100% và xếp hạng giảm dần")
    void testSupplierLossReportCalculationAndRanking() {
        Supplier supA = Supplier.builder().id(1L).supplierCode("NCC-A").supplierName("NCC Tươi Sống A").build();
        Supplier supB = Supplier.builder().id(2L).supplierCode("NCC-B").supplierName("NCC Hải Sản B").build();
        when(supplierRepository.findAll()).thenReturn(Arrays.asList(supA, supB));

        // NCC A: Nhập 200kg
        ImportBatch batchA = ImportBatch.builder()
                .supplier(supA)
                .initialQuantity(new BigDecimal("200.000"))
                .build();
        // NCC B: Nhập 100kg
        ImportBatch batchB = ImportBatch.builder()
                .supplier(supB)
                .initialQuantity(new BigDecimal("100.000"))
                .build();

        when(importBatchRepository.searchBatches(any(), any(), any(), any(), any()))
                .thenReturn(Arrays.asList(batchA, batchB));

        // NCC A hỏng: 4kg -> Tỷ lệ = 4 / 200 = 2.00%
        DamageReport drA = DamageReport.builder()
                .supplier(supA)
                .quantity(new BigDecimal("4.000"))
                .estimatedValue(new BigDecimal("1400000.00"))
                .build();

        // NCC B hỏng: 10kg -> Tỷ lệ = 10 / 100 = 10.00%
        DamageReport drB = DamageReport.builder()
                .supplier(supB)
                .quantity(new BigDecimal("10.000"))
                .estimatedValue(new BigDecimal("3500000.00"))
                .build();

        when(damageReportRepository.findByBranchIdOrderByCreatedAtDesc(1L))
                .thenReturn(Arrays.asList(drA, drB));

        List<SupplierLossResponse> report = warehouseService.getSupplierLossReport(1L, "2026-11", null);

        assertThat(report).hasSize(2);
        // NCC B có tỷ lệ hỏng 10.00% > 2.00% nên phải đứng Hạng 1
        SupplierLossResponse rank1 = report.get(0);
        assertThat(rank1.getSupplierCode()).isEqualTo("NCC-B");
        assertThat(rank1.getDamageRatePercentage()).isEqualByComparingTo("10.00");
        assertThat(rank1.getRank()).isEqualTo(1);
        assertThat(rank1.getEvaluation()).isEqualTo("NGHIÊM TRỌNG");

        // NCC A có tỷ lệ hỏng 2.00% đứng Hạng 2
        SupplierLossResponse rank2 = report.get(1);
        assertThat(rank2.getSupplierCode()).isEqualTo("NCC-A");
        assertThat(rank2.getDamageRatePercentage()).isEqualByComparingTo("2.00");
        assertThat(rank2.getRank()).isEqualTo(2);
    }

    @Test
    @DisplayName("Tiêu chí 4: Xuất file Excel báo cáo % hỏng NCC chuẩn định dạng POI")
    void testExportSupplierLossReportExcel() throws IOException {
        Supplier sup = Supplier.builder().id(1L).supplierCode("NCC-QN01").supplierName("Hải Sản Quảng Ninh").build();
        when(supplierRepository.findAll()).thenReturn(Collections.singletonList(sup));

        ImportBatch batch = ImportBatch.builder()
                .supplier(sup)
                .initialQuantity(new BigDecimal("100.000"))
                .build();
        when(importBatchRepository.searchBatches(any(), any(), any(), any(), any()))
                .thenReturn(Collections.singletonList(batch));

        DamageReport dr = DamageReport.builder()
                .supplier(sup)
                .quantity(new BigDecimal("5.000"))
                .estimatedValue(new BigDecimal("1750000.00"))
                .build();
        when(damageReportRepository.findByBranchIdOrderByCreatedAtDesc(1L))
                .thenReturn(Collections.singletonList(dr));

        byte[] excelBytes = warehouseService.exportSupplierLossReportExcel(1L, "2026-11", null);

        assertThat(excelBytes).isNotNull();
        assertThat(excelBytes.length).isGreaterThan(1000); // Kích thước hợp lệ của file .xlsx
    }

    @Test
    @DisplayName("Tiêu chí 2: Báo hỏng cua chết liên kết Lô nhập -> Trừ tồn lô và ghi nhận NCC trong KitchenService")
    void testDamageReportWithBatchLinkageDeductsStock() {
        DamageReportRepository mockDamageReportRepo = mock(DamageReportRepository.class);
        ImportBatchRepository mockBatchRepo = mock(ImportBatchRepository.class);
        InventoryStockRepository mockStockRepo = mock(InventoryStockRepository.class);
        SupplierRepository mockSupplierRepo = mock(SupplierRepository.class);
        BranchRepository mockBranchRepo = mock(BranchRepository.class);
        UserRepository mockUserRepo = mock(UserRepository.class);
        ItemRepository mockItemRepo = mock(ItemRepository.class);

        KitchenService kitchenService = new KitchenService(
                mockItemRepo, null, null, null,
                mockDamageReportRepo, null, mockBranchRepo, mockUserRepo,
                mockBatchRepo, mockStockRepo, mockSupplierRepo
        );

        when(mockBranchRepo.findById(1L)).thenReturn(Optional.of(branch));
        when(mockUserRepo.findById(10L)).thenReturn(Optional.of(user));
        when(mockItemRepo.findById(200L)).thenReturn(Optional.of(itemCua));

        ImportBatch lot = ImportBatch.builder()
                .id(999L)
                .batchCode("LOT-202611-001")
                .supplier(supplier)
                .item(itemCua)
                .branch(branch)
                .currentStock(new BigDecimal("100.000"))
                .build();
        when(mockBatchRepo.findById(999L)).thenReturn(Optional.of(lot));

        InventoryStock stock = InventoryStock.builder()
                .branch(branch)
                .item(itemCua)
                .batch(lot)
                .quantity(new BigDecimal("100.000"))
                .build();
        when(mockStockRepo.findByBranchIdAndItemIdAndBatchId(1L, 200L, 999L))
                .thenReturn(Optional.of(stock));

        when(mockDamageReportRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        DamageReportRequest request = DamageReportRequest.builder()
                .itemId(200L)
                .batchId(999L)
                .quantity(new BigDecimal("5.000"))
                .reason("Cua chết khi bảo quản bể oxy")
                .build();

        DamageReport report = kitchenService.recordDamageReport(request, userPrincipal);

        assertThat(report).isNotNull();
        assertThat(report.getBatch()).isEqualTo(lot);
        assertThat(report.getSupplier()).isEqualTo(supplier);
        assertThat(report.getBatchNumber()).isEqualTo("LOT-202611-001");
        assertThat(lot.getCurrentStock()).isEqualByComparingTo(new BigDecimal("95.000"));
        assertThat(stock.getQuantity()).isEqualByComparingTo(new BigDecimal("95.000"));
    }
}
