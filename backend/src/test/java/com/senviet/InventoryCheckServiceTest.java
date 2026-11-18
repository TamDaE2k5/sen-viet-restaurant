package com.senviet;

import com.senviet.domain.dto.request.CreateInventoryCheckRequest;
import com.senviet.domain.dto.request.InventoryCheckItemRequest;
import com.senviet.domain.dto.response.InventoryCheckItemResponse;
import com.senviet.domain.dto.response.InventoryCheckResponse;
import com.senviet.domain.entity.*;
import com.senviet.domain.repository.*;
import com.senviet.exception.ApiException;
import com.senviet.security.UserPrincipal;
import com.senviet.service.InventoryCheckService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
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
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Kiểm thử đơn vị (Unit Tests) cho Biên Bản Kiểm Kê Kho Đầu Ca / Cuối Ca.
 * Tuân thủ Tiêu chí Nghiệm thu 3 của Giai đoạn 7.
 */
@ExtendWith(MockitoExtension.class)
class InventoryCheckServiceTest {

    @Mock
    private InventoryCheckRepository inventoryCheckRepository;
    @Mock
    private InventoryCheckItemRepository inventoryCheckItemRepository;
    @Mock
    private InventoryStockRepository inventoryStockRepository;
    @Mock
    private ImportBatchRepository importBatchRepository;
    @Mock
    private ItemRepository itemRepository;
    @Mock
    private BranchRepository branchRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private InventorySnapshotRepository inventorySnapshotRepository;

    @InjectMocks
    private InventoryCheckService inventoryCheckService;

    private Branch branch;
    private User user;
    private UserPrincipal userPrincipal;
    private Item item;
    private ImportBatch batch;

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

        item = Item.builder()
                .id(100L)
                .itemCode("CUA_CA_MAU")
                .itemName("Cua Cà Mau (Tươi sống)")
                .unit("KG")
                .build();

        batch = ImportBatch.builder()
                .id(200L)
                .batchCode("LOT-202611-001")
                .item(item)
                .branch(branch)
                .currentStock(new BigDecimal("95.000"))
                .build();
    }

    @Test
    @DisplayName("Chặn lập biên bản kiểm kê nếu tồn thực tế khác tồn hệ thống mà không có lý do chênh lệch")
    void testInventoryCheckMissingReasonThrowsException() {
        when(branchRepository.findById(1L)).thenReturn(Optional.of(branch));
        when(userRepository.findById(10L)).thenReturn(Optional.of(user));
        when(itemRepository.findById(100L)).thenReturn(Optional.of(item));

        // Tồn hệ thống 95kg, tồn thực tế 90kg -> Lệch -5kg, nhưng reason rỗng
        InventoryCheckItemRequest itemReq = InventoryCheckItemRequest.builder()
                .itemId(100L)
                .systemStock(new BigDecimal("95.000"))
                .actualStock(new BigDecimal("90.000"))
                .reason("   ") // Rỗng
                .build();

        CreateInventoryCheckRequest request = CreateInventoryCheckRequest.builder()
                .branchId(1L)
                .shift("CA_TOI")
                .checkDate(LocalDate.now())
                .items(Collections.singletonList(itemReq))
                .build();

        assertThatThrownBy(() -> inventoryCheckService.createInventoryCheck(request, userPrincipal))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Bắt buộc ghi nhận lý do chênh lệch tồn");
    }

    @Test
    @DisplayName("Tiêu chí 3: Lập biên bản kiểm kê ghi nhận đúng người kiểm, ca làm việc, thời gian và lý do lệch")
    void testCreateValidInventoryCheck() {
        when(branchRepository.findById(1L)).thenReturn(Optional.of(branch));
        when(userRepository.findById(10L)).thenReturn(Optional.of(user));
        when(itemRepository.findById(100L)).thenReturn(Optional.of(item));
        when(importBatchRepository.findById(200L)).thenReturn(Optional.of(batch));

        when(inventoryCheckRepository.countByCheckCodeStartingWith(anyString())).thenReturn(0L);
        when(inventoryCheckRepository.findByCheckCode(anyString())).thenReturn(Optional.empty());
        when(inventoryCheckRepository.save(any(InventoryCheck.class))).thenAnswer(invocation -> {
            InventoryCheck c = invocation.getArgument(0);
            c.setId(111L);
            return c;
        });

        when(inventoryCheckItemRepository.save(any(InventoryCheckItem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        InventoryStock stock = InventoryStock.builder()
                .branch(branch)
                .item(item)
                .batch(batch)
                .quantity(new BigDecimal("95.000"))
                .build();
        when(inventoryStockRepository.findByBranchIdAndItemIdAndBatchId(1L, 100L, 200L))
                .thenReturn(Optional.of(stock));

        when(inventorySnapshotRepository.findFirstByBranchIdAndItemIdAndSnapshotDateAndShiftType(eq(1L), eq(100L), any(), eq("CA_TOI")))
                .thenReturn(Optional.empty());

        // Thực tế 92kg, hệ thống 95kg -> Lệch -3kg, có lý do
        InventoryCheckItemRequest itemReq = InventoryCheckItemRequest.builder()
                .itemId(100L)
                .batchId(200L)
                .systemStock(new BigDecimal("95.000"))
                .actualStock(new BigDecimal("92.000"))
                .reason("Cua rụng càng và hao hụt nước tự nhiên cuối ca")
                .build();

        CreateInventoryCheckRequest request = CreateInventoryCheckRequest.builder()
                .branchId(1L)
                .shift("CA_TOI")
                .checkDate(LocalDate.now())
                .note("Kiểm kê chốt ca tối")
                .items(Collections.singletonList(itemReq))
                .build();

        InventoryCheckResponse response = inventoryCheckService.createInventoryCheck(request, userPrincipal);

        assertThat(response).isNotNull();
        assertThat(response.getCheckCode()).startsWith("KK-");
        assertThat(response.getShift()).isEqualTo("CA_TOI");
        assertThat(response.getCheckedByName()).isEqualTo("Nguyễn Văn Bếp");
        assertThat(response.getItems()).hasSize(1);

        InventoryCheckItemResponse checkItemResp = response.getItems().get(0);
        assertThat(checkItemResp.getSystemStock()).isEqualByComparingTo(new BigDecimal("95.000"));
        assertThat(checkItemResp.getActualStock()).isEqualByComparingTo(new BigDecimal("92.000"));
        assertThat(checkItemResp.getDifference()).isEqualByComparingTo(new BigDecimal("-3.000"));
        assertThat(checkItemResp.getReason()).isEqualTo("Cua rụng càng và hao hụt nước tự nhiên cuối ca");

        // Verify cập nhật tồn lô về 92kg
        assertThat(batch.getCurrentStock()).isEqualByComparingTo(new BigDecimal("92.000"));
        verify(importBatchRepository, times(1)).save(batch);

        // Verify đồng bộ InventorySnapshot với closingStock = 92kg
        verify(inventorySnapshotRepository, times(1)).save(argThat(snap ->
                snap.getClosingStock().compareTo(new BigDecimal("92.000")) == 0 &&
                snap.getShiftType().equals("CA_TOI")
        ));
    }
}
