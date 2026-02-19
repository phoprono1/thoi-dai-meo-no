"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  ClientGameState,
  ClientPlayer,
  BOARD_TILES,
  PROPERTY_COLORS,
  PLAYER_COLORS,
  formatMoney,
} from "@/lib/coTyPhuData";
import Image from "next/image";

interface Props {
  gameState: ClientGameState;
  myPlayerId: string;
  onRollDice: () => void;
  onBuyProperty: () => void;
  onSkipBuy: () => void;
  onBuild: (tileIndex: number, action: "build" | "sell") => void;
  onMortgage: (tileIndex: number, action: "mortgage" | "unmortgage") => void;
  onSellProperty: (tileIndex: number) => void;
  onPayJail: () => void;
  onUseJailCard: () => void;
  onEndTurn: () => void;
  onSurrender: () => void;
}

type Tab = "actions" | "manage";

export default function ActionPanel({
  gameState,
  myPlayerId,
  onRollDice,
  onBuyProperty,
  onSkipBuy,
  onBuild,
  onMortgage,
  onSellProperty,
  onPayJail,
  onUseJailCard,
  onEndTurn,
  onSurrender,
}: Props) {
  const [tab, setTab] = useState<Tab>("actions");

  const myPlayer = gameState.players.find((p) => p.id === myPlayerId);
  const isMyTurn = gameState.currentPlayerId === myPlayerId;
  const pending = gameState.pendingAction;
  const dice = gameState.diceRoll;
  const canRoll =
    isMyTurn &&
    (dice === null || (dice.isDouble && pending === null && !myPlayer?.inJail));
  const canEndTurn = isMyTurn && dice !== null && pending === null;
  const isSellToPay =
    pending?.type === "sell_to_pay" && pending.playerId === myPlayerId;

  if (!myPlayer) return null;

  const myIdx = gameState.players.findIndex((p) => p.id === myPlayerId);
  const myColor = PLAYER_COLORS[myIdx % PLAYER_COLORS.length];
  const myOwned = gameState.ownedTiles.filter((o) => o.ownerId === myPlayerId);
  const timerPct = (gameState.turnTimeRemaining / 60) * 100;
  const timerDanger = gameState.turnTimeRemaining <= 10;

  return (
    <div
      style={{
        width: 280,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#0d1f12",
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid #1a3a22",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      {/* === Player Header === */}
      <div
        style={{
          background:
            "linear-gradient(135deg, #14532d 0%, #166534 60%, #15803d 100%)",
          padding: "12px 14px 10px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 80,
            height: 80,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.08)",
            top: -20,
            right: -20,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 50,
            height: 50,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.06)",
            top: 30,
            right: 10,
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            position: "relative",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              overflow: "hidden",
              border: `3px solid ${myColor}`,
              boxShadow: `0 0 12px ${myColor}88`,
              backgroundColor: "#fff",
              flexShrink: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/assets/co-ty-phu/tokens/${myPlayer.avatar}.png`}
              alt={myPlayer.avatar}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#fff",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {myPlayer.name}
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "#86efac",
                fontFamily: "monospace",
                letterSpacing: "-0.5px",
                lineHeight: 1.1,
              }}
            >
              {formatMoney(myPlayer.money)}
            </div>
            <div
              style={{
                display: "flex",
                gap: 6,
                marginTop: 2,
                flexWrap: "wrap",
              }}
            >
              {myPlayer.inJail && (
                <span
                  style={{
                    fontSize: 10,
                    backgroundColor: "rgba(0,0,0,0.35)",
                    color: "#fca5a5",
                    padding: "1px 6px",
                    borderRadius: 20,
                    fontWeight: 600,
                  }}
                >
                  🔒 Tù {myPlayer.jailTurns}/3
                </span>
              )}
              {myPlayer.getOutOfJailCards > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    backgroundColor: "rgba(0,0,0,0.35)",
                    color: "#fde68a",
                    padding: "1px 6px",
                    borderRadius: 20,
                    fontWeight: 600,
                  }}
                >
                  🃏 ×{myPlayer.getOutOfJailCards}
                </span>
              )}
            </div>
          </div>
          {isMyTurn && !myPlayer.isBankrupt && (
            <div
              className="animate-pulse"
              style={{
                backgroundColor: "#fbbf24",
                color: "#78350f",
                fontSize: 10,
                fontWeight: 800,
                padding: "3px 7px",
                borderRadius: 20,
                flexShrink: 0,
                boxShadow: "0 0 10px #fbbf2488",
              }}
            >
              LƯỢT BẠN
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: 8,
            height: 4,
            backgroundColor: "rgba(0,0,0,0.3)",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${timerPct}%`,
              backgroundColor: timerDanger ? "#ef4444" : "#4ade80",
              transition: "width 1s linear, background-color 0.3s",
              boxShadow: timerDanger ? "0 0 8px #ef4444" : undefined,
            }}
          />
        </div>
        {timerDanger && (
          <div
            className="animate-pulse"
            style={{
              textAlign: "center",
              fontSize: 10,
              color: "#fca5a5",
              marginTop: 2,
              fontWeight: 700,
            }}
          >
            ⏰ {gameState.turnTimeRemaining}s
          </div>
        )}
      </div>

      {/* === Tabs + Content OR Spectator === */}
      {myPlayer.isBankrupt ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px 16px",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 36 }}>👀</div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#fde68a",
              textAlign: "center",
            }}
          >
            Bạn đã phá sản
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#6b9e7a",
              textAlign: "center",
              lineHeight: 1.6,
            }}
          >
            Đang quan sát trận đấu.<br />
            Bạn vẫn có thể xem bàn cờ và nhắn tin!
          </div>
        </div>
      ) : (
        <>
      {/* === Tabs === */}
      <div
        style={{
          display: "flex",
          backgroundColor: "#0d1f12",
          borderBottom: "1px solid #1a3a22",
        }}
      >
        {(["actions", "manage"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: "9px 4px",
              fontSize: 12,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s",
              backgroundColor: tab === t ? "#14532d" : "transparent",
              color: tab === t ? "#86efac" : "#6b7280",
              borderBottom:
                tab === t ? "2px solid #4ade80" : "2px solid transparent",
              marginBottom: -1,
            }}
          >
            {t === "actions" ? "🎲 Hành động" : "🏠 Quản lý"}
            {t === "manage" && myOwned.length > 0 && (
              <span
                style={{
                  marginLeft: 4,
                  backgroundColor: "#166534",
                  color: "#86efac",
                  fontSize: 10,
                  padding: "0 5px",
                  borderRadius: 10,
                }}
              >
                {myOwned.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* === Content === */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          minHeight: 280,
        }}
      >
        {tab === "actions" ? (
          <ActionsTab
            gameState={gameState}
            myPlayer={myPlayer}
            isMyTurn={isMyTurn}
            canRoll={canRoll}
            canEndTurn={canEndTurn}
            isSellToPay={isSellToPay}
            onRollDice={onRollDice}
            onBuyProperty={onBuyProperty}
            onSkipBuy={onSkipBuy}
            onPayJail={onPayJail}
            onUseJailCard={onUseJailCard}
            onEndTurn={onEndTurn}
          />
        ) : (
          <ManageTab
            myOwned={myOwned}
            gameState={gameState}
            myPlayer={myPlayer}
            isMyTurn={isMyTurn}
            isSellToPay={isSellToPay}
            onBuild={onBuild}
            onMortgage={onMortgage}
            onSellProperty={onSellProperty}
          />
        )}
      </div>

      {/* === Surrender Button === */}
      <div
        style={{
          padding: "6px 10px 10px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <button
          onClick={() => {
            if (window.confirm("Bỏ cuộc? Bạn sẽ bị tính là phá sản và trở thành khán giả.")) {
              onSurrender();
            }
          }}
          style={{
            width: "100%",
            padding: "6px",
            borderRadius: 6,
            border: "1px solid rgba(239,68,68,0.3)",
            cursor: "pointer",
            background: "rgba(239,68,68,0.08)",
            color: "#f87171",
            fontWeight: 600,
            fontSize: 11,
          }}
        >
          🏳️ Bỏ cuộc
        </button>
      </div>
        </>
      )}

    </div>
  );
}

// ── Actions Tab ────────────────────────────────────────────────────────────────
function ActionsTab({
  gameState,
  myPlayer,
  isMyTurn,
  canRoll,
  canEndTurn,
  isSellToPay,
  onRollDice,
  onBuyProperty,
  onSkipBuy,
  onPayJail,
  onUseJailCard,
  onEndTurn,
}: {
  gameState: ClientGameState;
  myPlayer: ClientPlayer;
  isMyTurn: boolean;
  canRoll: boolean;
  canEndTurn: boolean;
  isSellToPay: boolean;
  onRollDice: () => void;
  onBuyProperty: () => void;
  onSkipBuy: () => void;
  onPayJail: () => void;
  onUseJailCard: () => void;
  onEndTurn: () => void;
}) {
  const pending = gameState.pendingAction;

  // ── Dice rolling animation ──
  const [isRolling, setIsRolling] = useState(false);
  const [animDice, setAnimDice] = useState<{ d1: number; d2: number }>({
    d1: 1,
    d2: 1,
  });
  const rollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevDiceRef = useRef(gameState.diceRoll);

  // When server sends dice result, stop animation
  useEffect(() => {
    if (
      isRolling &&
      gameState.diceRoll !== null &&
      gameState.diceRoll !== prevDiceRef.current
    ) {
      if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
      rollIntervalRef.current = null;
      setIsRolling(false);
    }
    prevDiceRef.current = gameState.diceRoll;
  }, [gameState.diceRoll, isRolling]);

  const handleRoll = useCallback(() => {
    if (!canRoll) return;
    setIsRolling(true);
    // Shuffle animation — 160ms per frame so the eye can follow
    rollIntervalRef.current = setInterval(() => {
      setAnimDice({
        d1: Math.floor(Math.random() * 6) + 1,
        d2: Math.floor(Math.random() * 6) + 1,
      });
    }, 160);
    onRollDice();
    // Safety stop after 3s if server doesn't respond
    setTimeout(() => {
      if (rollIntervalRef.current) {
        clearInterval(rollIntervalRef.current);
        rollIntervalRef.current = null;
        setIsRolling(false);
      }
    }, 3000);
  }, [canRoll, onRollDice]);

  // The dice to display: animated random while rolling, actual result otherwise
  const displayDice = isRolling
    ? animDice
    : gameState.diceRoll
      ? { d1: gameState.diceRoll.die1, d2: gameState.diceRoll.die2 }
      : null;

  return (
    <>
      {isSellToPay && (
        <div
          style={{
            backgroundColor: "#450a0a",
            border: "1px solid #dc2626",
            borderRadius: 8,
            padding: "10px 12px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fca5a5" }}>
            ⚠️ Cần trả nợ!
          </div>
          <div style={{ fontSize: 11, color: "#fecaca", marginTop: 2 }}>
            Vào tab Quản lý để bán tài sản.
          </div>
        </div>
      )}

      {isMyTurn && myPlayer.inJail && gameState.diceRoll === null && (
        <div
          style={{
            backgroundColor: "#1c1917",
            border: "1px solid #44403c",
            borderRadius: 8,
            padding: "10px 12px",
          }}
        >
          <div
            style={{
              textAlign: "center",
              fontSize: 12,
              fontWeight: 700,
              color: "#fbbf24",
              marginBottom: 8,
            }}
          >
            🔒 Đang ở tù
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {myPlayer.getOutOfJailCards > 0 && (
              <GreenBtn onClick={onUseJailCard}>🃏 Dùng thẻ thoát tù</GreenBtn>
            )}
            <RedBtn onClick={onPayJail} disabled={myPlayer.money < 2_000_000}>
              💰 Nộp phạt 2,000,000 ₫
            </RedBtn>
            <div
              style={{ textAlign: "center", fontSize: 10, color: "#6b7280" }}
            >
              hoặc tung xúc xắc để thử thoát
            </div>
          </div>
        </div>
      )}

      {isMyTurn && !isSellToPay && (
        <DiceBtn onClick={handleRoll} disabled={!canRoll || isRolling}>
          {isRolling
            ? "🎲 Đang tung..."
            : canRoll
              ? "🎲 Tung Xúc Xắc"
              : "✅ Đã tung xúc xắc"}
          {!isRolling && gameState.diceRoll?.isDouble && canRoll && (
            <span style={{ fontSize: 11, marginLeft: 4 }}>
              (ĐÔI → tung thêm)
            </span>
          )}
        </DiceBtn>
      )}

      {/* Dice display — shows during animation AND after result */}
      {(displayDice || isRolling) && (
        <div
          style={{
            backgroundColor: "#0f2818",
            border: `1px solid ${isRolling ? "#4ade80" : "#166534"}`,
            borderRadius: 8,
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            transition: "border-color 0.3s",
            boxShadow: isRolling ? "0 0 12px rgba(74,222,128,0.2)" : undefined,
          }}
        >
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <DiceDisplay value={displayDice?.d1 ?? 1} rolling={isRolling} />
            <span style={{ color: "#6b7280", fontWeight: 700 }}>+</span>
            <DiceDisplay value={displayDice?.d2 ?? 1} rolling={isRolling} />
          </div>
          <div>
            {isRolling ? (
              <div
                style={{
                  fontSize: 13,
                  color: "#4ade80",
                  fontWeight: 700,
                  animation: "pulse 0.5s infinite",
                }}
              >
                ...
              </div>
            ) : gameState.diceRoll ? (
              <>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: "#4ade80",
                    fontFamily: "monospace",
                    lineHeight: 1,
                  }}
                >
                  = {gameState.diceRoll.die1 + gameState.diceRoll.die2}
                </div>
                {gameState.diceRoll.isDouble && (
                  <div
                    className="animate-pulse"
                    style={{ fontSize: 10, color: "#fbbf24", fontWeight: 700 }}
                  >
                    ĐÔI!
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}

      {pending?.type === "buy_property" && pending.playerId === myPlayer.id && (
        <BuyPropertyCard
          myPlayer={myPlayer}
          onBuyProperty={onBuyProperty}
          onSkipBuy={onSkipBuy}
        />
      )}

      {isMyTurn && canEndTurn && !isSellToPay && (
        <BlueBtn onClick={onEndTurn}>⏩ Kết thúc lượt</BlueBtn>
      )}

      {!isMyTurn && (
        <div
          style={{ textAlign: "center", padding: "24px 0", color: "#4b5563" }}
        >
          <div style={{ fontSize: 28, marginBottom: 6 }}>⏳</div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>
            Đang đợi lượt của người khác...
          </div>
          {(() => {
            const cur = gameState.players.find(
              (p) => p.id === gameState.currentPlayerId,
            );
            return cur ? (
              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                Lượt:{" "}
                <span style={{ color: "#86efac", fontWeight: 600 }}>
                  {cur.name}
                </span>
              </div>
            ) : null;
          })()}
        </div>
      )}
    </>
  );
}

function BuyPropertyCard({
  myPlayer,
  onBuyProperty,
  onSkipBuy,
}: {
  myPlayer: ClientPlayer;
  onBuyProperty: () => void;
  onSkipBuy: () => void;
}) {
  const tile = BOARD_TILES[myPlayer.position];
  const canAfford = myPlayer.money >= (tile.price ?? 0);
  const colorHex = tile.color ? PROPERTY_COLORS[tile.color] : null;
  return (
    <div
      style={{
        backgroundColor: "#0f2818",
        border: "1px solid #166534",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      {tile.image ? (
        <div style={{ position: "relative", height: 80 }}>
          <Image
            src={`/assets/co-ty-phu/${tile.image}`}
            alt={tile.name}
            fill
            className="object-cover"
            sizes="260px"
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)",
            }}
          />
          {colorHex && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 5,
                backgroundColor: colorHex,
              }}
            />
          )}
          <div
            style={{
              position: "absolute",
              bottom: 6,
              left: 10,
              right: 10,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#fff",
                textShadow: "0 1px 4px rgba(0,0,0,0.9)",
              }}
            >
              {tile.name}
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: "#86efac",
                fontFamily: "monospace",
                textShadow: "0 1px 4px rgba(0,0,0,0.9)",
              }}
            >
              {formatMoney(tile.price ?? 0)}
            </span>
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: "10px 12px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: "#e5e7eb" }}>
            {tile.name}
          </span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: "#86efac",
              fontFamily: "monospace",
            }}
          >
            {formatMoney(tile.price ?? 0)}
          </span>
        </div>
      )}
      <div style={{ padding: "8px 10px", display: "flex", gap: 8 }}>
        <button
          onClick={onBuyProperty}
          disabled={!canAfford}
          style={{
            flex: 1,
            padding: "8px",
            borderRadius: 8,
            border: "none",
            cursor: canAfford ? "pointer" : "not-allowed",
            backgroundColor: canAfford ? "#16a34a" : "#14532d",
            color: canAfford ? "#fff" : "#6b7280",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          ✅ Mua
        </button>
        <button
          onClick={onSkipBuy}
          style={{
            flex: 1,
            padding: "8px",
            borderRadius: 8,
            border: "1px solid #374151",
            cursor: "pointer",
            backgroundColor: "#1f2937",
            color: "#9ca3af",
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          ❌ Bỏ qua
        </button>
      </div>
    </div>
  );
}

// ── Manage Tab ─────────────────────────────────────────────────────────────────
function ManageTab({
  myOwned,
  gameState,
  myPlayer: _myPlayer,
  isMyTurn,
  isSellToPay,
  onBuild,
  onMortgage,
  onSellProperty,
}: {
  myOwned: ClientGameState["ownedTiles"];
  gameState: ClientGameState;
  myPlayer: ClientPlayer;
  isMyTurn: boolean;
  isSellToPay: boolean;
  onBuild: (tileIndex: number, action: "build" | "sell") => void;
  onMortgage: (tileIndex: number, action: "mortgage" | "unmortgage") => void;
  onSellProperty: (tileIndex: number) => void;
}) {
  const canManage = isMyTurn || isSellToPay;
  if (!canManage)
    return (
      <div style={{ textAlign: "center", padding: "28px 0", color: "#4b5563" }}>
        <div style={{ fontSize: 24, marginBottom: 6 }}>⏳</div>
        <div style={{ fontSize: 12 }}>Chỉ quản lý được trong lượt của bạn.</div>
      </div>
    );
  if (myOwned.length === 0)
    return (
      <div style={{ textAlign: "center", padding: "28px 0", color: "#4b5563" }}>
        <div style={{ fontSize: 24, marginBottom: 6 }}>🏚️</div>
        <div style={{ fontSize: 12 }}>Bạn chưa sở hữu tài sản nào.</div>
      </div>
    );

  return (
    <>
      {myOwned.map((o) => {
        const tile = BOARD_TILES[o.tileIndex];
        if (!tile) return null;
        const colorHex = tile.color ? PROPERTY_COLORS[tile.color] : "#6b7280";
        return (
          <div
            key={o.tileIndex}
            style={{
              backgroundColor: "#0f1f0f",
              border: `1px solid ${o.isMortgaged ? "#374151" : "#1a3a22"}`,
              borderLeft: `4px solid ${o.isMortgaged ? "#4b5563" : colorHex}`,
              borderRadius: 8,
              overflow: "hidden",
              opacity: o.isMortgaged ? 0.75 : 1,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 10px",
                borderBottom: "1px solid #1a3a22",
              }}
            >
              {tile.image && (
                <div
                  style={{
                    position: "relative",
                    width: 36,
                    height: 28,
                    borderRadius: 4,
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  <Image
                    src={`/assets/co-ty-phu/${tile.image}`}
                    alt={tile.name}
                    fill
                    className="object-cover"
                    sizes="36px"
                  />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#e5e7eb",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {tile.name}
                </div>
                <div style={{ display: "flex", gap: 4, marginTop: 1 }}>
                  {o.isMortgaged && (
                    <span
                      style={{
                        fontSize: 9,
                        backgroundColor: "#7f1d1d",
                        color: "#fca5a5",
                        padding: "0 4px",
                        borderRadius: 4,
                        fontWeight: 600,
                      }}
                    >
                      THẾ CHẤP
                    </span>
                  )}
                  {o.buildings > 0 && (
                    <span style={{ fontSize: 10, color: "#fbbf24" }}>
                      {o.buildings === 5 ? "🏨 KS" : `🏠×${o.buildings}`}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 5,
                padding: "6px 10px",
              }}
            >
              {tile.type === "property" &&
                !o.isMortgaged &&
                o.buildings < 5 && (
                  <Chip
                    bg="#166534"
                    onClick={() => onBuild(o.tileIndex, "build")}
                  >
                    +🏠 Xây
                  </Chip>
                )}
              {tile.type === "property" && o.buildings > 0 && (
                <Chip bg="#92400e" onClick={() => onBuild(o.tileIndex, "sell")}>
                  -🏠 Phá
                </Chip>
              )}
              {!o.isMortgaged && o.buildings === 0 && (
                <Chip
                  bg="#1e3a5f"
                  onClick={() => onMortgage(o.tileIndex, "mortgage")}
                >
                  📋 Thế chấp
                </Chip>
              )}
              {o.isMortgaged && (
                <Chip
                  bg="#1e3a5f"
                  onClick={() => onMortgage(o.tileIndex, "unmortgage")}
                >
                  🔓 Chuộc
                </Chip>
              )}
              {o.buildings === 0 && (
                <Chip bg="#7f1d1d" onClick={() => onSellProperty(o.tileIndex)}>
                  💰 Bán
                </Chip>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

// ── Shared UI helpers ──────────────────────────────────────────────────────────
function DiceDisplay({ value, rolling }: { value: number; rolling?: boolean }) {
  const dots: Record<number, [number, number][]> = {
    1: [[50, 50]],
    2: [
      [25, 25],
      [75, 75],
    ],
    3: [
      [25, 25],
      [50, 50],
      [75, 75],
    ],
    4: [
      [25, 25],
      [75, 25],
      [25, 75],
      [75, 75],
    ],
    5: [
      [25, 25],
      [75, 25],
      [50, 50],
      [25, 75],
      [75, 75],
    ],
    6: [
      [25, 20],
      [75, 20],
      [25, 50],
      [75, 50],
      [25, 80],
      [75, 80],
    ],
  };
  return (
    <div
      style={{
        width: 32,
        height: 32,
        backgroundColor: "#fff",
        borderRadius: 6,
        border: rolling ? "2px solid #4ade80" : "1.5px solid #374151",
        position: "relative",
        flexShrink: 0,
        boxShadow: rolling ? "0 0 8px rgba(74,222,128,0.6)" : undefined,
        transform: rolling
          ? `rotate(${Math.random() > 0.5 ? 5 : -5}deg)`
          : undefined,
        transition: rolling ? "none" : "transform 0.2s",
      }}
    >
      {(dots[value] ?? []).map(([x, y], i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: 5,
            height: 5,
            borderRadius: "50%",
            backgroundColor: "#1f2937",
            left: `${x}%`,
            top: `${y}%`,
            transform: "translate(-50%,-50%)",
          }}
        />
      ))}
    </div>
  );
}

function Chip({
  bg,
  onClick,
  children,
}: {
  bg: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "4px 8px",
        borderRadius: 6,
        border: "none",
        cursor: "pointer",
        backgroundColor: bg,
        color: "#e5e7eb",
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLButtonElement).style.filter =
          "brightness(1.3)")
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLButtonElement).style.filter = "brightness(1)")
      }
    >
      {children}
    </button>
  );
}

function DiceBtn({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "14px",
        borderRadius: 10,
        border: "none",
        cursor: disabled ? "default" : "pointer",
        background: disabled
          ? "linear-gradient(135deg,#14532d,#166534)"
          : "linear-gradient(135deg,#16a34a,#15803d)",
        color: disabled ? "#6b7280" : "#fff",
        fontWeight: 800,
        fontSize: 16,
        boxShadow: disabled ? "none" : "0 4px 15px rgba(22,163,74,0.4)",
        transition: "all 0.15s",
        lineHeight: 1.2,
      }}
    >
      {children}
    </button>
  );
}

function GreenBtn({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "9px",
        borderRadius: 8,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        backgroundColor: disabled ? "#14532d" : "#16a34a",
        color: disabled ? "#6b7280" : "#fff",
        fontWeight: 700,
        fontSize: 13,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

function RedBtn({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "9px",
        borderRadius: 8,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        backgroundColor: disabled ? "#450a0a" : "#dc2626",
        color: disabled ? "#6b7280" : "#fff",
        fontWeight: 700,
        fontSize: 13,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

function BlueBtn({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: "10px",
        borderRadius: 8,
        border: "none",
        cursor: "pointer",
        background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
        color: "#fff",
        fontWeight: 700,
        fontSize: 13,
        boxShadow: "0 2px 10px rgba(37,99,235,0.4)",
      }}
    >
      {children}
    </button>
  );
}
