import { Card } from "@/lib/types";
import { GameCard } from "../GameCard";

interface Props {
  cards: Card[];
  onClose: () => void;
}

export function SeeFutureModal({ cards, onClose }: Props) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>🔮 3 Lá Trên Cùng</h3>
        <div className="modal-cards">
          {cards.map((card, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <GameCard card={card} disabled showTooltip={false} />
              <p
                style={{
                  fontSize: "11px",
                  color: "var(--tet-text-muted)",
                  marginTop: "4px",
                }}
              >
                {i === 0 ? "🔜 Sẽ bốc" : i === 1 ? "Thứ 2" : "Thứ 3"}
              </p>
            </div>
          ))}
        </div>
        <button
          className="btn btn-outline"
          style={{ width: "100%" }}
          onClick={onClose}
        >
          Đóng
        </button>
      </div>
    </div>
  );
}
