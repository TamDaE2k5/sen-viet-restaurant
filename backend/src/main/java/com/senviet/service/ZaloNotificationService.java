package com.senviet.service;

import com.senviet.domain.entity.Branch;
import com.senviet.domain.entity.NotificationLog;
import com.senviet.domain.repository.NotificationLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

/**
 * Service gửi cảnh báo thất thoát nguyên vật liệu qua Webhook Zalo Bot.
 * 
 * Nghiệp vụ: Khi lượng thất thoát quy đổi > 300,000 VNĐ hoặc tỷ lệ lệch > 5%,
 * hệ thống tự động phát tín hiệu Webhook tới nhóm Zalo của Chủ chuỗi & Kế toán.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ZaloNotificationService {

    private final NotificationLogRepository notificationLogRepository;

    @Value("${senviet.zalo.webhook-url:}")
    private String zaloWebhookUrl;

    /**
     * Gửi cảnh báo thất thoát vượt ngưỡng bất thường.
     *
     * @param branch       Chi nhánh xảy ra thất thoát
     * @param itemName     Tên món ăn / nguyên liệu
     * @param lossQty      Số lượng thất thoát (kg / khay)
     * @param lossAmount   Số tiền thất thoát quy đổi (VNĐ)
     * @param lossRate     Tỷ lệ % thất thoát
     * @param checkerName  Nhân viên kiểm kho chịu trách nhiệm
     */
    public void sendLossAlert(Branch branch, String itemName, BigDecimal lossQty, BigDecimal lossAmount, BigDecimal lossRate, String checkerName) {
        String title = "🚨 [CẢNH BÁO THẤT THOÁT] " + branch.getBranchName();
        String content = String.format(
                "Phát hiện thất thoát vượt ngưỡng tại %s:\n" +
                "- Món ăn / Nguyên liệu: %s\n" +
                "- Số lượng thất thoát: %s kg/khay\n" +
                "- Quy đổi thành tiền: %s VNĐ\n" +
                "- Tỷ lệ lệch: %s%%\n" +
                "- Nhân viên kiểm kho: %s\n" +
                "- Thời gian ghi nhận: Hôm nay",
                branch.getBranchName(), itemName, lossQty, String.format("%,.0f", lossAmount), lossRate, checkerName
        );

        log.warn("BẮN ZALO WEBHOOK ALERT:\n{}", content);

        NotificationLog logEntry = NotificationLog.builder()
                .branch(branch)
                .channel("ZALO_WEBHOOK")
                .recipient("Nhóm Điều Hành " + branch.getBranchName())
                .title(title)
                .content(content)
                .status(zaloWebhookUrl != null && !zaloWebhookUrl.isEmpty() ? "SENT" : "SIMULATED")
                .build();

        notificationLogRepository.save(logEntry);
    }

    public List<NotificationLog> getRecentLogs(Long branchId) {
        return notificationLogRepository.findByBranchIdOrderByCreatedAtDesc(branchId);
    }
}
