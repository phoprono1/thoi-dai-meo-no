"use client";

import { useState } from "react";
import { CARD_INFO, Card } from "@/lib/types";
import ImageWithFallback from "@/components/ImageWithFallback";
import { CardIcon } from "./CardIcon";

interface Props {
  card: Card;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  isPlaying?: boolean;
  isDrawing?: boolean;
  showTooltip?: boolean;
}

export function GameCard({
  card,
  selected,
  disabled,
  onClick,
  isPlaying,
  isDrawing,
  showTooltip = true,
}: Props) {
  const info = CARD_INFO[card.type];
  const [tooltipVisible, setTooltipVisible] = useState(false);

  return (
    <div
      className={`game-card ${selected ? "card-selected" : ""} ${disabled ? "card-disabled" : ""} ${isPlaying ? "card-playing" : ""} ${isDrawing ? "card-drawing" : ""}`}
      style={{
        background: `linear-gradient(135deg, ${info.color}dd, ${info.color}88)`,
      }}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setTooltipVisible(true)}
      onMouseLeave={() => setTooltipVisible(false)}
    >
      <ImageWithFallback
        src={info.image}
        alt={info.name}
        fill
        sizes="(max-width: 768px) 100px, 200px"
        style={{ objectFit: "cover" }}
        priority={isDrawing || isPlaying}
      />
      <span className="card-name">{info.name}</span>
      <span className="card-short-desc">{info.shortDesc}</span>
      {showTooltip && tooltipVisible && (
        <div className="card-tooltip">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "4px",
            }}
          >
            <CardIcon type={card.type} size={16} />
            <strong>{info.name}</strong>
          </div>
          <p>{info.description}</p>
        </div>
      )}
    </div>
  );
}
