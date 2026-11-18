package com.senviet;

import com.senviet.domain.dto.request.*;
import com.senviet.domain.dto.response.BatchLossResult;
import com.senviet.domain.dto.response.BatchResponse;
import com.senviet.domain.dto.response.DailyWasteConfirmationResponse;
import com.senviet.domain.entity.*;
import com.senviet.domain.repository.*;
import com.senviet.exception.ApiException;
import com.senviet.exception.UnapprovedDamageReportException;
import com.senviet.security.UserPrincipal;
import com.senviet.service.KitchenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Kiểm thử đơn vị (Unit Tests) cho Phân hệ Bếp & Quy Tắc Chặt Chẽ Phase 8.
 * Tuân thủ tiêu chí nghiệm thu 1, 2, 3, 4, 5.
 */
@ExtendWith(MockitoExtension.class)
class KitchenServiceTest {

    @Mock
    private ItemRepository itemRepository;
    @Mock
    private RecipeRepository recipeRepository;
    @Mock
    private TakeOutLogRepository takeOutLogRepository;
    @Mock
    private ProcessingBatchRepository batchRepository;
    @Mock
    private DamageReportRepository damageReportRepository;
    @Mock
    private LineItemLogRepository lineItemLogRepository;
    @Mock
    private BranchRepository branchRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ImportBatchRepository importBatchRepository;
    @Mock
    private InventoryStockRepository inventoryStockRepository;
    @Mock
    private SupplierRepository supplierRepository;
    @Mock
    private DailyWasteConfirmationRepository dailyWasteConfirmationRepository;

    private KitchenService kitchenService;
    private Branch branch;
    private User user;
    private UserPrincipal userPrincipal;
    private Item itemCua;

    @BeforeEach
    void setUp() {
        kitchenService = new KitchenService(
                itemRepository, recipeRepository, takeOutLogRepository,
                batchRepository, damageReportRepository, lineItemLogRepository,
                branchRepository, userRepository, importBatchRepository,
                inventoryStockRepository, supplierRepository, dailyWasteConfirmationRepository
        );

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

        itemCua = Item.builder()
                .id(200L)
                .itemCode("CUA_CA_MAU")
                .itemName("Cua Cà Mau (Tươi sống)")
                .unit("KG")
                .costPrice(new BigDecimal("350000.00"))
                .isBuffetLine(true)
                .isDailyOnly(false)
                .build();
    }

    // =========================================================================
    // 1. Kiểm thử công thức hao hụt mẻ chế biến (TDD Core)
    // =========================================================================

    @Test
    @DisplayName("Cua hấp 10kg -> 8kg thành phẩm: Hao hụt đúng 20%, không vượt định mức chuẩn 20%")
    void testStandardBatchLossRateWithinLimit() {
        BigDecimal inputWeight = new BigDecimal("10.0");
        BigDecimal outputWeight = new BigDecimal("8.0");
        BigDecimal standardLoss = new BigDecimal("20.00");

        BatchLossResult result = kitchenService.calculateBatchLoss(inputWeight, outputWeight, standardLoss);

        assertThat(result.getLossRate()).isEqualByComparingTo("20.00");
        assertThat(result.isOverStandard()).isFalse();
    }

    @Test
    @DisplayName("Cua hấp 10kg -> 7.5kg thành phẩm: Hao hụt 25%, vượt định mức chuẩn 20% -> Bật cờ isOverStandard")
    void testOverStandardBatchLossRate() {
        BigDecimal inputWeight = new BigDecimal("10.0");
        BigDecimal outputWeight = new BigDecimal("7.5");
        BigDecimal standardLoss = new BigDecimal("20.00");

        BatchLossResult result = kitchenService.calculateBatchLoss(inputWeight, outputWeight, standardLoss);

        assertThat(result.getLossRate()).isEqualByComparingTo("25.00");
        assertThat(result.isOverStandard()).isTrue();
    }

    @Test
    @DisplayName("Thành phẩm không thể nặng hơn nguyên liệu thô đầu vào -> Ném ApiException")
    void testOutputGreaterThanInputThrowsException() {
        BigDecimal inputWeight = new BigDecimal("10.0");
        BigDecimal outputWeight = new BigDecimal("11.5");
        BigDecimal standardLoss = new BigDecimal("20.00");

        assertThatThrownBy(() -> kitchenService.calculateBatchLoss(inputWeight, outputWeight, standardLoss))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("không thể vượt quá khối lượng đầu vào");
    }

    // =========================================================================
    // 2. Tiêu chí 1 & 2: Chặn cứng mẻ hỏng chưa duyệt (HTTP 422)
    // =========================================================================

    @Test
    @DisplayName("Tiêu chí 1: Món có báo hỏng đang chờ duyệt (CHO_DUYET) -> Chặn cứng mở mẻ mới, ném UnapprovedDamageReportException (422)")
    void testStartBatchBlockedWhenDamageReportPendingApproval() {
        when(branchRepository.findById(1L)).thenReturn(Optional.of(branch));
        when(userRepository.findById(10L)).thenReturn(Optional.of(user));
        when(itemRepository.findById(200L)).thenReturn(Optional.of(itemCua));

        // Tồn tại báo hỏng CHO_DUYET của Cua Cà Mau
        when(damageReportRepository.existsByBranchIdAndItemIdAndStatus(1L, 200L, "CHO_DUYET"))
                .thenReturn(true);

        StartBatchRequest request = StartBatchRequest.builder()
                .itemId(200L)
                .inputWeight(new BigDecimal("15.000"))
                .build();

        assertThatThrownBy(() -> kitchenService.startBatch(request, userPrincipal))
                .isInstanceOf(UnapprovedDamageReportException.class)
                .hasMessageContaining("Món này đang có mẻ/lô báo hỏng chờ Quản lý duyệt");

        verify(batchRepository, never()).save(any());
    }

    @Test
    @DisplayName("Tiêu chí 2: Khi không còn báo hỏng chờ duyệt -> Cho phép tạo mẻ mới bình thường")
    void testStartBatchAllowedWhenNoPendingDamageReport() {
        when(branchRepository.findById(1L)).thenReturn(Optional.of(branch));
        when(userRepository.findById(10L)).thenReturn(Optional.of(user));
        when(itemRepository.findById(200L)).thenReturn(Optional.of(itemCua));

        when(damageReportRepository.existsByBranchIdAndItemIdAndStatus(1L, 200L, "CHO_DUYET"))
                .thenReturn(false);
        when(batchRepository.existsByBranchIdAndItemIdAndStatus(1L, 200L, "DANG_LAM"))
                .thenReturn(false);
        when(recipeRepository.findFirstByItemId(200L)).thenReturn(Optional.empty());

        when(batchRepository.save(any(ProcessingBatch.class))).thenAnswer(invocation -> {
            ProcessingBatch b = invocation.getArgument(0);
            b.setId(301L);
            return b;
        });

        StartBatchRequest request = StartBatchRequest.builder()
                .itemId(200L)
                .inputWeight(new BigDecimal("15.000"))
                .build();

        BatchResponse response = kitchenService.startBatch(request, userPrincipal);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(301L);
        assertThat(response.getStatus()).isEqualTo("DANG_LAM");
        assertThat(response.getInputWeight()).isEqualByComparingTo(new BigDecimal("15.000"));
    }

    // =========================================================================
    // 3. Tiêu chí 3: Xác nhận ghi bỏ món dùng trong ngày cuối ca
    // =========================================================================

    @Test
    @DisplayName("Tiêu chí 3: Xác nhận ghi bỏ món dùng trong ngày cuối ca -> Lưu biên bản xác nhận và trừ tồn kho")
    void testConfirmDailyWasteEndOfShift() {
        when(branchRepository.findById(1L)).thenReturn(Optional.of(branch));
        when(userRepository.findById(10L)).thenReturn(Optional.of(user));

        Item itemKimChi = Item.builder()
                .id(204L)
                .itemCode("KIM_CHI")
                .itemName("Kim Chi Cải Thảo Hàn Quốc")
                .unit("KG")
                .isDailyOnly(true)
                .build();
        when(itemRepository.findById(204L)).thenReturn(Optional.of(itemKimChi));

        when(dailyWasteConfirmationRepository.save(any(DailyWasteConfirmation.class)))
                .thenAnswer(invocation -> {
                    DailyWasteConfirmation c = invocation.getArgument(0);
                    c.setId(901L);
                    return c;
                });

        ImportBatch batch = ImportBatch.builder()
                .id(801L)
                .item(itemKimChi)
                .branch(branch)
                .currentStock(new BigDecimal("5.000"))
                .status("CON_HANG")
                .build();
        when(importBatchRepository.findByBranchIdAndItemIdAndCurrentStockGreaterThanOrderByImportDateAsc(1L, 204L, BigDecimal.ZERO))
                .thenReturn(Collections.singletonList(batch));

        InventoryStock stock = InventoryStock.builder()
                .branch(branch)
                .item(itemKimChi)
                .batch(batch)
                .quantity(new BigDecimal("5.000"))
                .build();
        when(inventoryStockRepository.findByBranchIdAndItemIdAndBatchId(1L, 204L, 801L))
                .thenReturn(Optional.of(stock));

        DailyWasteItemRequest itemReq = DailyWasteItemRequest.builder()
                .itemId(204L)
                .quantity(new BigDecimal("2.500"))
                .note("Hết ca tối, chua quá không để qua đêm")
                .build();

        ConfirmDailyWasteRequest request = ConfirmDailyWasteRequest.builder()
                .branchId(1L)
                .shift("CA_TOI")
                .wasteDate(LocalDate.now())
                .items(Collections.singletonList(itemReq))
                .build();

        List<DailyWasteConfirmationResponse> responses = kitchenService.confirmDailyWaste(request, userPrincipal);

        assertThat(responses).hasSize(1);
        DailyWasteConfirmationResponse resp = responses.get(0);
        assertThat(resp.getItemCode()).isEqualTo("KIM_CHI");
        assertThat(resp.getQuantity()).isEqualByComparingTo(new BigDecimal("2.500"));
        assertThat(resp.getStatus()).isEqualTo("DA_XAC_NHAN");

        // Verify tồn kho còn lại 2.5kg
        assertThat(batch.getCurrentStock()).isEqualByComparingTo(new BigDecimal("2.500"));
        assertThat(stock.getQuantity()).isEqualByComparingTo(new BigDecimal("2.500"));
    }

    // =========================================================================
    // 4. Tiêu chí 4: Nút Ra Line chỉ ghi log, tuyệt đối KHÔNG trừ kho
    // =========================================================================

    @Test
    @DisplayName("Tiêu chí 4: Bấm +1 ra line 10 lần -> Tạo 10 bản ghi line_item_logs, KHÔNG hề gọi trừ kho")
    void testRecordLineItemDoesNotDeductInventoryStock() {
        when(branchRepository.findById(1L)).thenReturn(Optional.of(branch));
        when(userRepository.findById(10L)).thenReturn(Optional.of(user));
        when(itemRepository.findById(200L)).thenReturn(Optional.of(itemCua));
        when(lineItemLogRepository.existsByRequestId(anyString())).thenReturn(false);
        when(lineItemLogRepository.save(any(LineItemLog.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Thực hiện bấm 10 lần
        for (int i = 0; i < 10; i++) {
            LineItemIncRequest request = LineItemIncRequest.builder()
                    .itemId(200L)
                    .quantity(1)
                    .requestId("REQ-" + i)
                    .build();

            LineItemLog result = kitchenService.recordLineItem(request, userPrincipal);
            assertThat(result).isNotNull();
            assertThat(result.getQuantity()).isEqualTo(1);
        }

        // Khẳng định 10 bản ghi được lưu
        verify(lineItemLogRepository, times(10)).save(any(LineItemLog.class));

        // Khẳng định TUYỆT ĐỐI không có thao tác trừ kho hay cập nhật kho nào được thực thi
        verifyNoInteractions(importBatchRepository);
        verifyNoInteractions(inventoryStockRepository);
    }

    // =========================================================================
    // 5. Tiêu chí 5: Thêm nhanh món mới ra Line buffet
    // =========================================================================

    @Test
    @DisplayName("Tiêu chí 5: Thêm nhanh món mới 'Nộm hoa chuối' ngay tại quầy buffet -> Lưu vào danh mục món ra line")
    void testQuickAddLineItem() {
        when(itemRepository.existsByItemCode("NOM_HOA_CHUOI")).thenReturn(false);
        when(itemRepository.save(any(Item.class))).thenAnswer(invocation -> {
            Item it = invocation.getArgument(0);
            it.setId(777L);
            return it;
        });

        QuickAddLineItemRequest request = QuickAddLineItemRequest.builder()
                .itemName("Nộm hoa chuối tai heo")
                .itemCode("NOM_HOA_CHUOI")
                .category("RAU_CU")
                .unit("ĐĨA")
                .costPrice(new BigDecimal("35000.00"))
                .isBuffetLine(true)
                .isDailyOnly(true)
                .build();

        Item createdItem = kitchenService.quickAddLineItem(request, userPrincipal);

        assertThat(createdItem).isNotNull();
        assertThat(createdItem.getId()).isEqualTo(777L);
        assertThat(createdItem.getItemCode()).isEqualTo("NOM_HOA_CHUOI");
        assertThat(createdItem.getItemName()).isEqualTo("Nộm hoa chuối tai heo");
        assertThat(createdItem.getIsBuffetLine()).isTrue();
        assertThat(createdItem.getIsDailyOnly()).isTrue();

        verify(itemRepository, times(1)).save(argThat(it ->
                it.getItemCode().equals("NOM_HOA_CHUOI") &&
                it.getIsBuffetLine() &&
                it.getIsDailyOnly()
        ));
    }
}
