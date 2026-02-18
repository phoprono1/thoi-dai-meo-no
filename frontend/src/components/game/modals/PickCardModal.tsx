import { Card } from "@/lib/types";
import { GameCard } from "../GameCard";

interface Props {
  cards: Card[];
  source: string;
  onPick: (cardId: string) => void;
}

export function PickCardModal({ cards, source, onPick }: Props) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>
          {source === "discard"
            ? "🗑️ Chọn lá từ đống bỏ"
            : "👀 Chọn lá từ tay đối thủ"}
        </h3>
        <div className="modal-cards">
          {cards.map((card) => (
            <GameCard
              key={card.id}
              card={card}
              onClick={() => onPick(card.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
