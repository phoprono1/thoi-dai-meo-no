import { CardType, CARD_INFO } from "@/lib/types";
import { CardIcon } from "./CardIcon";

interface Props {
  onClose: () => void;
}

export function HelpModal({ onClose }: Props) {
  const cardTypes = Object.values(CardType);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal help-modal" onClick={(e) => e.stopPropagation()}>
        <h3>📖 Hướng Dẫn Chơi Mèo Nổ</h3>

        <div className="help-section">
          <h4>🎯 Mục tiêu</h4>
          <p>Sống sót! Người cuối cùng không bị Pháo Mèo 🧨 loại sẽ thắng.</p>
        </div>

        <div className="help-section">
          <h4>🔄 Luật chơi</h4>
          <ol>
            <li>
              Mỗi lượt bạn có thể chơi bao nhiêu lá tùy thích (hoặc không chơi).
            </li>
            <li>
              Cuối lượt <strong>phải bốc 1 lá</strong> từ bộ bài.
            </li>
            <li>
              Nếu bốc phải <strong>Pháo Mèo 🧨</strong>, bạn{" "}
              <strong>bị loại</strong> trừ khi có <strong>Tháo Ngòi 🧯</strong>.
            </li>
            <li>
              Dùng Tháo Ngòi → chọn vị trí đặt Pháo Mèo lại vào bộ bài (bẫy
              người khác!).
            </li>
            <li>
              Mỗi lượt có <strong>30 giây</strong>. Hết giờ → tự động bốc bài!
            </li>
          </ol>
        </div>

        <div className="help-section">
          <h4>🃏 Combo Mèo</h4>
          <ul>
            <li>
              <strong>2 mèo giống</strong> → Lấy ngẫu nhiên 1 lá từ tay đối thủ
            </li>
            <li>
              <strong>3 mèo giống</strong> → Xem tay đối thủ, chọn 1 lá
            </li>
            <li>
              <strong>5 mèo khác loại</strong> → Lấy 1 lá từ đống bỏ
            </li>
          </ul>
        </div>

        <div className="help-section">
          <h4>🃏 Danh sách lá bài</h4>
          <div className="help-card-list">
            {cardTypes.map((type) => {
              const info = CARD_INFO[type];
              return (
                <div key={type} className="help-card-item">
                  <span
                    className="help-card-icon"
                    style={{
                      background: `${info.color}33`,
                      borderColor: info.color,
                    }}
                  >
                    <CardIcon type={type} size={24} />
                  </span>
                  <div className="help-card-info">
                    <strong>{info.name}</strong>
                    <p>{info.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          className="btn btn-gold"
          style={{ width: "100%" }}
          onClick={onClose}
        >
          Đã hiểu! 👍
        </button>
      </div>
    </div>
  );
}
