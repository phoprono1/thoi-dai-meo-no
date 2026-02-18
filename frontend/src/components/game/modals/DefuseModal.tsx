interface Props {
  deckCount: number;
  onDefuse: (position: number) => void;
}

export function DefuseModal({ deckCount, onDefuse }: Props) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>🧯 Tháo Ngòi!</h3>
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
