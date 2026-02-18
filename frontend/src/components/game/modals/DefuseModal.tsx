import { useEffect, useState } from "react";

const AUTO_DEFUSE_SECONDS = 10;

interface Props {
  deckCount: number;
  onDefuse: (position: number) => void;
}

export function DefuseModal({ deckCount, onDefuse }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(AUTO_DEFUSE_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  const urgency = secondsLeft <= 3;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>🧯 Tháo Ngòi!</h3>

        {/* Countdown */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "12px",
          }}
        >
          <span
            className={urgency ? "turn-timer urgent pulse-glow" : "turn-timer"}
            style={{ fontSize: "20px", padding: "6px 18px" }}
          >
            ⏳ {secondsLeft}s
          </span>
        </div>

        <p
          style={{
            fontSize: "14px",
            color: "var(--tet-text-muted)",
            marginBottom: "16px",
            textAlign: "center",
          }}
        >
          Chọn vị trí đặt lại Pháo Mèo vào bộ bài (0 = trên cùng, {deckCount} =
          dưới cùng)
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            justifyContent: "center",
          }}
        >
          {Array.from({ length: Math.min(deckCount + 1, 20) }, (_, i) => (
            <button
              key={i}
              className="btn btn-outline btn-sm"
              onClick={() => onDefuse(i)}
            >
              {i === 0 ? "⬆️ Trên" : i === deckCount ? "⬇️ Dưới" : i}
            </button>
          ))}
          <button
            className="btn btn-gold btn-sm"
            onClick={() =>
              onDefuse(Math.floor(Math.random() * (deckCount + 1)))
            }
          >
            🎲 Ngẫu nhiên
          </button>
        </div>
      </div>
    </div>
  );
}
