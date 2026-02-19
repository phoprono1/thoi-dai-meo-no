"use client";
import { useState, useEffect, useRef } from "react";
import {
  BOARD_TILES,
  getTileGridPos,
  ClientGameState,
  ClientOwnedTile,
  PLAYER_COLORS,
  formatMoney,
} from "@/lib/coTyPhuData";
import BoardTile from "./BoardTile";
import Image from "next/image";

// Board dimensions: 90px corners + 64px edges = 90+576+90 = 756px
const CORNER = 90;
const EDGE = 64;
const BOARD_SIZE = CORNER * 2 + EDGE * 9; // 756

interface Props {
  gameState: ClientGameState;
  onTileClick?: (tileIndex: number) => void;
}

const TOTAL_TILES = 40;
const TELEPORT_THRESHOLD = 13;
const STEP_DELAY_MS = 200;

export default function Board({ gameState, onTileClick }: Props) {
  const { players, ownedTiles, currentPlayerId } = gameState;

  // ── Movement animation ──
  const [displayPos, setDisplayPos] = useState<Record<string, number>>({});
  const displayPosRef = useRef<Record<string, number>>({});
  const animTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    players.forEach((p) => {
      if (p.isBankrupt) return;
      const targetPos = p.inJail ? 10 : p.position;
      const fromPos = displayPosRef.current[p.id] ?? targetPos;

      // First time seeing this player — initialise without animation
      if (displayPosRef.current[p.id] === undefined) {
        displayPosRef.current[p.id] = targetPos;
        setDisplayPos((prev) => ({ ...prev, [p.id]: targetPos }));
        return;
      }

      if (fromPos === targetPos) return;

      const dist = (targetPos - fromPos + TOTAL_TILES) % TOTAL_TILES;

      // Large jump (teleport / Go-to-jail) — instant
      if (dist > TELEPORT_THRESHOLD) {
        if (animTimers.current[p.id]) clearTimeout(animTimers.current[p.id]);
        displayPosRef.current[p.id] = targetPos;
        setDisplayPos((prev) => ({ ...prev, [p.id]: targetPos }));
        return;
      }

      // Step-by-step animation
      if (animTimers.current[p.id]) clearTimeout(animTimers.current[p.id]);

      const animStep = (current: number) => {
        const next = (current + 1) % TOTAL_TILES;
        displayPosRef.current[p.id] = next;
        setDisplayPos((prev) => ({ ...prev, [p.id]: next }));
        if (next !== targetPos) {
          animTimers.current[p.id] = setTimeout(
            () => animStep(next),
            STEP_DELAY_MS,
          );
        }
      };
      animStep(fromPos);
    });
  }, [players]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      Object.values(animTimers.current).forEach(clearTimeout);
    };
  }, []);

  const ownedMap = new Map<number, ClientOwnedTile>();
  ownedTiles.forEach((o) => ownedMap.set(o.tileIndex, o));

  // Players grouped by animated display position
  const playersByPos = new Map<number, typeof players>();
  players.forEach((p) => {
    if (p.isBankrupt) return;
    const pos = displayPos[p.id] ?? (p.inJail ? 10 : p.position);
    if (!playersByPos.has(pos)) playersByPos.set(pos, []);
    playersByPos.get(pos)!.push(p);
  });

  const currentPlayer = players.find((p) => p.id === currentPlayerId);

  const colTemplate = `${CORNER}px repeat(9, ${EDGE}px) ${CORNER}px`;
  const rowTemplate = `${CORNER}px repeat(9, ${EDGE}px) ${CORNER}px`;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: colTemplate,
        gridTemplateRows: rowTemplate,
        width: BOARD_SIZE,
        height: BOARD_SIZE,
        flexShrink: 0,
        border: "3px solid #166534",
        borderRadius: 4,
        backgroundColor: "#dcfce7",
        boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
      }}
    >
      {/* Tiles */}
      {BOARD_TILES.map((tile) => {
        const { col, row } = getTileGridPos(tile.index);
        const owned = ownedMap.get(tile.index);
        const playersHere = playersByPos.get(tile.index) ?? [];

        return (
          <div
            key={tile.index}
            style={{
              gridColumn: col,
              gridRow: row,
              width: "100%",
              height: "100%",
            }}
          >
            <BoardTile
              tile={tile}
              owned={owned}
              playersHere={playersHere}
              allPlayers={players}
              isCurrentPlayerTile={
                !!(
                  currentPlayer &&
                  !currentPlayer.inJail &&
                  (displayPos[currentPlayer.id] ?? currentPlayer.position) ===
                    tile.index
                ) ||
                !!(
                  tile.index === 10 &&
                  players.some(
                    (p) => p.inJail && playersByPos.get(10)?.includes(p),
                  )
                )
              }
              onClick={onTileClick ? () => onTileClick(tile.index) : undefined}
            />
          </div>
        );
      })}

      {/* ── Center panel ── */}
      <div
        style={{
          gridColumn: "2 / 11",
          gridRow: "2 / 11",
          backgroundColor: "#f0fdf4",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: 12,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Title */}
        <div className="text-center select-none">
          <div
            className="font-extrabold leading-tight"
            style={{ fontSize: 18, color: "#14532d" }}
          >
            🏦 Cờ Tỷ Phú
          </div>
          <div style={{ fontSize: 10, color: "#16a34a" }}>Việt Nam</div>
        </div>

        {/* Dice display */}
        {gameState.diceRoll && (
          <div className="flex gap-2 items-center">
            <DiceFace value={gameState.diceRoll.die1} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#374151" }}>
              +
            </span>
            <DiceFace value={gameState.diceRoll.die2} />
            {gameState.diceRoll.isDouble && (
              <span
                className="font-bold animate-pulse"
                style={{ fontSize: 11, color: "#ea580c" }}
              >
                ĐÔI!
              </span>
            )}
          </div>
        )}

        {/* Current card */}
        {gameState.currentCard && (
          <div
            className="text-center w-full rounded-lg"
            style={{
              padding: "6px 8px",
              backgroundColor:
                gameState.currentCard.type === "chance" ? "#fff7ed" : "#eff6ff",
              border: `1px solid ${
                gameState.currentCard.type === "chance" ? "#fed7aa" : "#bfdbfe"
              }`,
              maxWidth: 360,
            }}
          >
            <div
              className="font-bold"
              style={{
                fontSize: 10,
                color:
                  gameState.currentCard.type === "chance"
                    ? "#c2410c"
                    : "#1d4ed8",
              }}
            >
              {gameState.currentCard.type === "chance"
                ? "🃏 Cơ Hội"
                : "🎁 Khí Vận"}
            </div>
            <div
              style={{
                fontSize: 10,
                color: "#374151",
                lineHeight: 1.4,
                marginTop: 2,
              }}
            >
              {gameState.currentCard.text}
            </div>
          </div>
        )}

        {/* Players */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 4,
            width: "100%",
            maxWidth: 380,
          }}
        >
          {players.map((p, idx) => {
            const color = PLAYER_COLORS[idx % PLAYER_COLORS.length];
            const isCurrent = p.id === currentPlayerId;
            return (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "3px 5px",
                  borderRadius: 6,
                  border: `1.5px solid ${isCurrent ? "#facc15" : "#d1d5db"}`,
                  backgroundColor: isCurrent ? "#fefce8" : "#ffffff",
                  opacity: p.isBankrupt ? 0.4 : 1,
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    overflow: "hidden",
                    backgroundColor: "#ffffff",
                    border: `2.5px solid ${color}`,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                    flexShrink: 0,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/assets/co-ty-phu/tokens/${p.avatar}.png`}
                    alt={p.avatar}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display =
                        "none";
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      color: p.isBankrupt ? "#9ca3af" : "#111827",
                      textDecoration: p.isBankrupt ? "line-through" : undefined,
                    }}
                  >
                    {p.name}
                    {p.isDisconnected && (
                      <span style={{ marginLeft: 2, fontSize: 8 }}>📶</span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      fontFamily: "monospace",
                      color: "#15803d",
                      fontWeight: 700,
                    }}
                  >
                    {p.isBankrupt ? "💸" : formatMoney(p.money)}
                  </div>
                </div>
                {p.inJail && (
                  <span style={{ fontSize: 9, flexShrink: 0 }}>🔒</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Pending alert */}
        {gameState.pendingAction?.type === "sell_to_pay" && (
          <div
            className="text-center font-bold"
            style={{
              fontSize: 10,
              color: "#b91c1c",
              backgroundColor: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: 6,
              padding: "4px 8px",
              width: "100%",
              maxWidth: 360,
            }}
          >
            ⚠️ Cần bán tài sản để trả nợ
          </div>
        )}

        {/* Action log */}
        <div
          style={{
            width: "100%",
            maxWidth: 380,
            backgroundColor: "rgba(255,255,255,0.85)",
            borderRadius: 6,
            border: "1px solid #bbf7d0",
            padding: "5px 8px",
            overflow: "hidden",
            flex: 1,
            minHeight: 0,
          }}
        >
          {gameState.log.slice(-5).map((entry, i, arr) => (
            <div
              key={i}
              style={{
                fontSize: i === arr.length - 1 ? 12 : 10,
                lineHeight: 1.5,
                color: i === arr.length - 1 ? "#111827" : "#6b7280",
                fontWeight: i === arr.length - 1 ? 700 : 400,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                borderTop: i > 0 ? "1px solid #f0fdf4" : undefined,
                paddingTop: i > 0 ? 2 : 0,
              }}
            >
              {entry}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DiceFace({ value }: { value: number }) {
  return (
    <div
      style={{
        position: "relative",
        width: 44,
        height: 44,
        borderRadius: 8,
        backgroundColor: "white",
        border: "2.5px solid #1f2937",
        boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <Image
        src={`/assets/co-ty-phu/ui/dice-${value}.png`}
        alt={`Dice ${value}`}
        fill
        className="object-contain p-0.5"
        sizes="44px"
      />
    </div>
  );
}
