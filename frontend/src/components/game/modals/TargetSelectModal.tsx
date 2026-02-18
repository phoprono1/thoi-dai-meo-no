import { AVATARS, ClientPlayer } from "@/lib/types";
import ImageWithFallback from "@/components/ImageWithFallback";
import { Cat } from "lucide-react";

interface Props {
  opponents: ClientPlayer[];
  onSelect: (playerId: string) => void;
  onClose: () => void;
}

export function TargetSelectModal({ opponents, onSelect, onClose }: Props) {
  const validTargets = opponents.filter(
    (p) => p.isAlive && p.cardCount > 0 && !p.isDisconnected,
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>🎯 Chọn đối thủ</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {validTargets.map((p) => {
            const av = AVATARS.find((a) => a.id === p.avatar);
            return (
              <button
                key={p.id}
                className="btn btn-outline"
                onClick={() => onSelect(p.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  justifyContent: "center",
                }}
              >
                {av?.image ? (
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      overflow: "hidden",
                    }}
                  >
                    <ImageWithFallback
                      src={av.image}
                      alt=""
                      width={20}
                      height={20}
                    />
                  </div>
                ) : (
                  <Cat size={16} />
                )}
                {p.name} ({p.cardCount} lá)
              </button>
            );
          })}
        </div>
        <button
          className="btn btn-outline"
          style={{ marginTop: "12px", width: "100%" }}
          onClick={onClose}
        >
          Hủy
        </button>
      </div>
    </div>
  );
}
