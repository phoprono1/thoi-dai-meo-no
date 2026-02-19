"use client";
import { useEffect, useRef } from "react";

interface HelpSection {
  icon: string;
  title: string;
  lines: string[];
}

const SECTIONS: HelpSection[] = [
  {
    icon: "🎯",
    title: "Mục tiêu",
    lines: [
      "Trở thành người duy nhất không phá sản.",
      "Mua đất, xây nhà, thu tiền thuê để làm giàu.",
      "Đối thủ hết tiền và không trả được nợ → phá sản → bạn thắng!",
    ],
  },
  {
    icon: "🎲",
    title: "Lượt chơi",
    lines: [
      "Tung 2 xúc xắc, di chuyển số ô tương ứng.",
      "Trên ô đất trống → có thể mua. Ô của địch → trả tiền thuê.",
      "Tung đôi (hai mặt giống nhau) → được tung lại. Tung đôi 3 lần liên tiếp → vào Tù.",
      "Qua ô Xuất Phát → nhận 2 triệu.",
    ],
  },
  {
    icon: "🏠",
    title: "Nhà & Khách Sạn",
    lines: [
      "Sở hữu toàn bộ 1 nhóm màu → được xây nhà.",
      "Mỗi nhóm màu xây đều nhau (không xây chênh lệch quá 1 nhà).",
      "Tối đa 4 nhà/ô → nâng lên Khách Sạn (tiền thuê tối đa).",
      "Bán nhà lấy lại 50% giá xây.",
    ],
  },
  {
    icon: "🚂",
    title: "Bến Tàu & Tiện Ích",
    lines: [
      "4 Bến Tàu: sở hữu càng nhiều, tiền thuê càng cao (25K → 200K).",
      "2 Tiện Ích (điện, nước): tiền thuê = tung xúc xắc × hệ số (4× hoặc 10×).",
    ],
  },
  {
    icon: "🔒",
    title: "Nhà Tù",
    lines: [
      "Vào Tù khi: đi qua ô 'Vào Tù', tung đôi 3 lần, rút thẻ Cơ Hội/Khí Vận.",
      "Thoát Tù: tung đôi trong 3 lượt, nộp 500K, hoặc dùng thẻ Thoát Tù.",
      "Đang ở Tù vẫn thu tiền thuê bình thường.",
    ],
  },
  {
    icon: "💳",
    title: "Cơ Hội & Khí Vận",
    lines: [
      "Rút thẻ khi đi vào ô Cơ Hội (🎴) hoặc Khí Vận (🌟).",
      "Hiệu ứng: nhận/trả tiền, di chuyển đến ô khác, vào Tù, nhận thẻ thoát tù...",
    ],
  },
  {
    icon: "🏦",
    title: "Thế Chấp",
    lines: [
      "Thế chấp đất để nhận ngay 50% giá gốc.",
      "Đất đang thế chấp không thu được tiền thuê.",
      "Chuộc lại = 55% giá gốc (thêm 10% lãi).",
    ],
  },
  {
    icon: "💸",
    title: "Phá Sản",
    lines: [
      "Không thể trả nợ dù đã bán/thế chấp hết tài sản → phá sản.",
      "Toàn bộ tài sản được trả cho chủ nợ (hoặc về ngân hàng).",
      "Người chơi phá sản trở thành khán giả (vẫn có thể xem và chat).",
      "Thoát giữa chừng cũng bị tính là phá sản.",
    ],
  },
  {
    icon: "🏆",
    title: "Chiến Thắng",
    lines: [
      "Còn lại 1 người chưa phá sản → người đó thắng.",
      "Nếu tất cả thoát phòng trừ 1 người → người còn lại thắng.",
    ],
  },
];

export default function HelpModal({ onClose }: { onClose: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          background: "linear-gradient(160deg, #0c2a1a 0%, #0a1f14 100%)",
          border: "1px solid #1a4d2a",
          borderRadius: 16,
          width: "100%",
          maxWidth: 660,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px 14px",
            borderBottom: "1px solid #1a4d2a",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "#fde68a",
                letterSpacing: "0.03em",
              }}
            >
              🏦 Hướng Dẫn Cờ Tỷ Phú
            </div>
            <div style={{ fontSize: 12, color: "#6b9e7a", marginTop: 3 }}>
              Phiên bản Việt Nam · 2–6 người chơi
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#9ca3af",
              width: 32,
              height: 32,
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div
          style={{
            overflowY: "auto",
            padding: "16px 24px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {SECTIONS.map((sec) => (
            <div
              key={sec.title}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 10,
                padding: "12px 16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 18 }}>{sec.icon}</span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#fde68a",
                  }}
                >
                  {sec.title}
                </span>
              </div>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                }}
              >
                {sec.lines.map((line, i) => (
                  <li
                    key={i}
                    style={{
                      fontSize: 13,
                      color: "#c8d9cf",
                      lineHeight: 1.55,
                    }}
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Quick reference */}
          <div
            style={{
              background: "rgba(251,191,36,0.07)",
              border: "1px solid rgba(251,191,36,0.2)",
              borderRadius: 10,
              padding: "12px 16px",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#fde68a",
                marginBottom: 8,
              }}
            >
              💡 Mẹo nhanh
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "6px 20px",
              }}
            >
              {[
                ["Qua ô Xuất Phát", "+2 triệu"],
                ["Đỗ Xe", "Không có gì (an toàn)"],
                ["Thuế Thu Nhập", "-2 triệu"],
                ["Thuế Sang Trọng", "-750 nghìn"],
                ["Tung đôi 3 lần", "→ Vào Tù"],
                ["Tiền bắt đầu", "15 triệu"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    color: "#9ca3af",
                    gap: 8,
                  }}
                >
                  <span style={{ color: "#d1d5db" }}>{label}</span>
                  <span
                    style={{
                      color: "#fbbf24",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              textAlign: "center",
              fontSize: 12,
              color: "#4b6657",
              marginTop: 4,
            }}
          >
            Nhấn Esc hoặc click bên ngoài để đóng
          </div>
        </div>
      </div>
    </div>
  );
}
