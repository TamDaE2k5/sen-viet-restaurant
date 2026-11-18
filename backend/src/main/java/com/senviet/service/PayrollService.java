package com.senviet.service;

import com.senviet.domain.dto.response.PayrollResponse;
import com.senviet.domain.entity.*;
import com.senviet.domain.repository.*;
import com.senviet.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service Động Cơ Tổng Hợp Bảng Lương Tự Động & Xuất Danh Sách Chuyển Khoản Ngân Hàng.
 * 
 * Các quy tắc bất khả xâm phạm:
 * 1. Khấu trừ tự động tiền ứng lương thực chi trong tháng.
 * 2. Nhân viên tự ý bỏ việc: Lương = 0 đ, ghi chú rõ "Bỏ việc — không trả theo quy định".
 * 3. Nhân viên nghỉ việc chưa hoàn tất 100% đồng phục: Trạng thái 'DANG_GIU_LUONG',
 *    tuyệt đối loại khỏi file lệnh chi chuyển khoản ngân hàng.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PayrollService {

    private final PayrollRepository payrollRepository;
    private final UserRepository userRepository;
    private final BranchRepository branchRepository;
    private final AttendanceRepository attendanceRepository;
    private final SalaryAdvanceRepository salaryAdvanceRepository;
    private final SalaryIncreaseProposalRepository proposalRepository;
    private final ResignationRequestRepository resignationRequestRepository;
    private final SalaryRuleRepository salaryRuleRepository;

    public static final BigDecimal DEFAULT_STANDARD_DAYS = new BigDecimal("26.0");

    /**
     * Tự động tổng hợp bảng lương chi nhánh theo tháng (định dạng 'YYYY-MM').
     */
    @Transactional
    public List<PayrollResponse> generateMonthlyPayroll(String month, Long branchId, UserPrincipal executor) {
        String payrollMonth = month != null ? month : LocalDate.now().toString().substring(0, 7);
        List<User> users = branchId != null
                ? userRepository.findByBranchId(branchId)
                : userRepository.findAll();

        List<PayrollResponse> responses = new ArrayList<>();

        for (User user : users) {
            Branch branch = user.getBranch();
            BigDecimal standardDays = DEFAULT_STANDARD_DAYS;
            if (branch != null) {
                Optional<SalaryRule> ruleOpt = salaryRuleRepository.findFirstByBranchId(branch.getId());
                if (ruleOpt.isPresent() && ruleOpt.get().getStandardWorkDays() != null) {
                    standardDays = ruleOpt.get().getStandardWorkDays();
                }
            }

            // 1. Kiểm tra trạng thái bỏ việc
            boolean isAbandoned = false;
            Optional<ResignationRequest> resignOpt = resignationRequestRepository.findFirstByUserIdAndStatusNot(user.getId(), "HOAN_TAT");
            if (resignOpt.isPresent() && (resignOpt.get().getIsAbandoned() || "BO_VIEC".equals(resignOpt.get().getStatus()))) {
                isAbandoned = true;
            }

            // 2. Kiểm tra trạng thái giữ lương đồng phục
            boolean isUniformRetained = false;
            if (resignOpt.isPresent() && "DANG_GIU_LUONG".equals(resignOpt.get().getStatus())) {
                isUniformRetained = true;
            }

            // 3. Tính số ngày công thực tế
            BigDecimal actualDays = BigDecimal.valueOf(24.0); // Mặc định cho demo nếu chưa đủ dữ liệu cả tháng
            // 4. Lương cơ bản
            BigDecimal baseSalary = user.getBaseSalary() != null ? user.getBaseSalary() : new BigDecimal("7500000.00");

            // 5. Thưởng tăng lương từ đề xuất đã duyệt
            BigDecimal salaryRaise = BigDecimal.ZERO;
            List<SalaryIncreaseProposal> approvedProposals = proposalRepository.findByUserIdAndStatus(user.getId(), "DA_DUYET");
            for (SalaryIncreaseProposal p : approvedProposals) {
                salaryRaise = salaryRaise.add(p.getRaiseAmount());
            }

            // 6. Khấu trừ tạm ứng lương trong tháng này
            BigDecimal advanceDeduction = BigDecimal.ZERO;
            List<SalaryAdvance> advances = salaryAdvanceRepository.findByUserIdAndDeductionMonth(user.getId(), payrollMonth);
            for (SalaryAdvance a : advances) {
                if ("DA_CHI".equals(a.getStatus()) && a.getDisbursedAmount() != null) {
                    advanceDeduction = advanceDeduction.add(a.getDisbursedAmount());
                }
            }

            BigDecimal allowance = new BigDecimal("500000.00"); // Phụ cấp ăn ca tiêu chuẩn
            BigDecimal penaltyDeduction = BigDecimal.ZERO;

            BigDecimal grossSalary;
            BigDecimal netSalary;
            String status;
            String note = "";

            if (isAbandoned) {
                // TỰ Ý BỎ VIỆC: Lương = 0 đ
                baseSalary = BigDecimal.ZERO;
                salaryRaise = BigDecimal.ZERO;
                allowance = BigDecimal.ZERO;
                grossSalary = BigDecimal.ZERO;
                advanceDeduction = BigDecimal.ZERO;
                penaltyDeduction = BigDecimal.ZERO;
                netSalary = BigDecimal.ZERO;
                status = "BO_VIEC";
                note = "Bỏ việc — không trả theo quy định";
            } else {
                // Tính Gross: (Base + Raise) * ActualDays / StandardDays + Allowance
                BigDecimal effectiveSalary = baseSalary.add(salaryRaise);
                BigDecimal prorated = effectiveSalary.multiply(actualDays).divide(standardDays, 2, RoundingMode.HALF_UP);
                grossSalary = prorated.add(allowance);

                // Tính Net: Gross - Tạm ứng - Phạt
                netSalary = grossSalary.subtract(advanceDeduction).subtract(penaltyDeduction);
                if (netSalary.compareTo(BigDecimal.ZERO) < 0) {
                    netSalary = BigDecimal.ZERO;
                }

                if (isUniformRetained) {
                    status = "DANG_GIU_LUONG";
                    note = "ĐANG GIỮ LƯƠNG: " + (resignOpt.get().getMissingUniformDetails() != null ? resignOpt.get().getMissingUniformDetails() : "Chưa trả đủ đồng phục");
                } else {
                    status = "CHO_DUYET";
                    note = advanceDeduction.compareTo(BigDecimal.ZERO) > 0 ? "Đã khấu trừ tạm ứng " + advanceDeduction + " đ" : "Bình thường";
                }
            }

            // Tìm hoặc cập nhật bảng lương
            Optional<Payroll> existingOpt = payrollRepository.findByUserIdAndPayrollMonth(user.getId(), payrollMonth);
            Payroll payroll;
            if (existingOpt.isPresent()) {
                payroll = existingOpt.get();
                payroll.setBaseSalary(baseSalary);
                payroll.setStandardWorkDays(standardDays);
                payroll.setActualWorkDays(actualDays);
                payroll.setSalaryRaise(salaryRaise);
                payroll.setAllowance(allowance);
                payroll.setGrossSalary(grossSalary);
                payroll.setAdvanceDeduction(advanceDeduction);
                payroll.setPenaltyDeduction(penaltyDeduction);
                payroll.setNetSalary(netSalary);
                payroll.setStatus(status);
                payroll.setIsAbandoned(isAbandoned);
                payroll.setIsUniformRetained(isUniformRetained);
                payroll.setBankName(user.getBankName());
                payroll.setBankAccountNumber(user.getBankAccountNumber());
                payroll.setBankAccountHolder(user.getBankAccountHolder());
                payroll.setNote(note);
                payroll.setUpdatedAt(Instant.now());
            } else {
                payroll = Payroll.builder()
                        .user(user)
                        .branch(branch)
                        .payrollMonth(payrollMonth)
                        .baseSalary(baseSalary)
                        .standardWorkDays(standardDays)
                        .actualWorkDays(actualDays)
                        .salaryRaise(salaryRaise)
                        .allowance(allowance)
                        .grossSalary(grossSalary)
                        .advanceDeduction(advanceDeduction)
                        .penaltyDeduction(penaltyDeduction)
                        .netSalary(netSalary)
                        .status(status)
                        .isAbandoned(isAbandoned)
                        .isUniformRetained(isUniformRetained)
                        .bankName(user.getBankName())
                        .bankAccountNumber(user.getBankAccountNumber())
                        .bankAccountHolder(user.getBankAccountHolder())
                        .note(note)
                        .createdAt(Instant.now())
                        .updatedAt(Instant.now())
                        .build();
            }

            payrollRepository.save(payroll);
            responses.add(mapToResponse(payroll));
        }

        log.info("Tổng hợp bảng lương tháng {} thành công cho {} nhân sự", payrollMonth, responses.size());
        return responses;
    }

    @Transactional(readOnly = true)
    public List<PayrollResponse> getPayrolls(String month, Long branchId) {
        String payrollMonth = month != null ? month : LocalDate.now().toString().substring(0, 7);
        List<Payroll> list = branchId != null
                ? payrollRepository.findByBranchIdAndPayrollMonthOrderByUserId(branchId, payrollMonth)
                : payrollRepository.findByPayrollMonthOrderByBranchIdAscUserIdAsc(payrollMonth);

        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PayrollResponse> getMyPayrolls(Long userId) {
        return payrollRepository.findByUserIdOrderByPayrollMonthDesc(userId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    /**
     * Xuất file Excel danh sách lệnh chi chuyển khoản ngân hàng.
     * Quy tắc bảo mật tài chính:
     * - Tự động loại trừ các nhân viên có trạng thái 'BO_VIEC' hoặc 'DANG_GIU_LUONG'.
     * - Chỉ xuất những người có thực lĩnh > 0.
     */
    @Transactional(readOnly = true)
    public byte[] exportBankTransferExcel(String month, Long branchId) throws IOException {
        String payrollMonth = month != null ? month : LocalDate.now().toString().substring(0, 7);
        List<Payroll> list = branchId != null
                ? payrollRepository.findByBranchIdAndPayrollMonthOrderByUserId(branchId, payrollMonth)
                : payrollRepository.findByPayrollMonthOrderByBranchIdAscUserIdAsc(payrollMonth);

        // Lọc nghiêm ngặt: Loại trừ bỏ việc, giữ lương và số tiền <= 0
        List<Payroll> eligibleList = list.stream()
                .filter(p -> !"BO_VIEC".equals(p.getStatus()))
                .filter(p -> !"DANG_GIU_LUONG".equals(p.getStatus()))
                .filter(p -> p.getNetSalary() != null && p.getNetSalary().compareTo(BigDecimal.ZERO) > 0)
                .collect(Collectors.toList());

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Lenh_Chi_Ngan_Hang");

            // Fonts & Styles
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);

            CellStyle titleStyle = workbook.createCellStyle();
            titleStyle.setFont(titleFont);
            titleStyle.setAlignment(HorizontalAlignment.CENTER);

            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.ROYAL_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setBorderBottom(BorderStyle.THIN);

            CellStyle currencyStyle = workbook.createCellStyle();
            DataFormat format = workbook.createDataFormat();
            currencyStyle.setDataFormat(format.getFormat("#,##0"));
            currencyStyle.setAlignment(HorizontalAlignment.RIGHT);

            // Title Row
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("DANH SÁCH LỆNH CHI CHUYỂN KHOẢN NGÂN HÀNG - THÁNG " + payrollMonth);
            titleCell.setCellStyle(titleStyle);

            // Header Row
            String[] headers = {
                    "STT", "Mã NV", "Họ và Tên", "Chi Nhánh", "Tên Ngân Hàng",
                    "Số Tài Khoản", "Tên Chủ Tài Khoản", "Số Tiền Thực Chi (VNĐ)", "Nội Dung Chuyển Khoản"
            };

            Row headerRow = sheet.createRow(2);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data Rows
            int rowIdx = 3;
            BigDecimal totalDisbursement = BigDecimal.ZERO;

            for (int i = 0; i < eligibleList.size(); i++) {
                Payroll p = eligibleList.get(i);
                Row row = sheet.createRow(rowIdx++);

                row.createCell(0).setCellValue(i + 1);
                row.createCell(1).setCellValue("NV" + p.getUser().getId());
                row.createCell(2).setCellValue(p.getUser().getFullName());
                row.createCell(3).setCellValue(p.getBranch() != null ? p.getBranch().getBranchName() : "");
                row.createCell(4).setCellValue(p.getBankName() != null ? p.getBankName() : "Vietcombank");
                row.createCell(5).setCellValue(p.getBankAccountNumber() != null ? p.getBankAccountNumber() : "—");
                row.createCell(6).setCellValue(p.getBankAccountHolder() != null ? p.getBankAccountHolder() : p.getUser().getFullName().toUpperCase());

                Cell amountCell = row.createCell(7);
                amountCell.setCellValue(p.getNetSalary().doubleValue());
                amountCell.setCellStyle(currencyStyle);
                totalDisbursement = totalDisbursement.add(p.getNetSalary());

                row.createCell(8).setCellValue("Thanh toan luong T" + payrollMonth.substring(5) + " Sen Viet Buffet");
            }

            // Total Summary Row
            Row totalRow = sheet.createRow(rowIdx);
            Cell totalLabelCell = totalRow.createCell(6);
            totalLabelCell.setCellValue("TỔNG CỘNG THỰC CHI:");
            totalLabelCell.setCellStyle(headerStyle);

            Cell totalValCell = totalRow.createCell(7);
            totalValCell.setCellValue(totalDisbursement.doubleValue());
            totalValCell.setCellStyle(currencyStyle);

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    private PayrollResponse mapToResponse(Payroll p) {
        return PayrollResponse.builder()
                .id(p.getId())
                .userId(p.getUser().getId())
                .fullName(p.getUser().getFullName())
                .username(p.getUser().getUsername())
                .branchId(p.getBranch() != null ? p.getBranch().getId() : null)
                .branchName(p.getBranch() != null ? p.getBranch().getBranchName() : "")
                .payrollMonth(p.getPayrollMonth())
                .baseSalary(p.getBaseSalary())
                .standardWorkDays(p.getStandardWorkDays())
                .actualWorkDays(p.getActualWorkDays())
                .salaryRaise(p.getSalaryRaise())
                .allowance(p.getAllowance())
                .grossSalary(p.getGrossSalary())
                .advanceDeduction(p.getAdvanceDeduction())
                .penaltyDeduction(p.getPenaltyDeduction())
                .netSalary(p.getNetSalary())
                .status(p.getStatus())
                .isAbandoned(p.getIsAbandoned())
                .isUniformRetained(p.getIsUniformRetained())
                .bankName(p.getBankName())
                .bankAccountNumber(p.getBankAccountNumber())
                .bankAccountHolder(p.getBankAccountHolder())
                .note(p.getNote())
                .build();
    }
}
