"use client";
import { useState } from "react";
import {
  AVATARS,
  CAT_CARDS,
  CardType,
  ClientGameState,
  ClientRoom,
  ClientPlayer,
  Card,
  CARD_BACK_IMAGE,
} from "@/lib/types";
import ImageWithFallback from "@/components/ImageWithFallback";
import SoundToggle from "@/components/SoundToggle";
import { Cat, X, RotateCcw } from "lucide-react";
import { GameCard } from "./GameCard";
import { TurnTimer } from "./TurnTimer";
import { ChatBox } from "./ChatBox";
import { TargetSelectModal } from "./modals/TargetSelectModal";
import { DefuseModal } from "./modals/DefuseModal";
import { SeeFutureModal } from "./modals/SeeFutureModal";
import { PickCardModal } from "./modals/PickCardModal";
import { GameOverModal } from "./modals/GameOverModal";
import { useGame } from "@/hooks/useGame";

interface Props {
  game: ReturnType<typeof useGame>;
  onShowHelp: () => void;
}

export function GameBoard({ game, onShowHelp }: Props) {
  const gs: ClientGameState = game.gameState!;
  const room: ClientRoom = game.currentRoom!;

  const [showChat, setShowChat] = useState(false);
  const [isSorted, setIsSorted] = useState(false);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [targetPlayer, setTargetPlayer] = useState<string | null>(null);
  const [showTargetSelect, setShowTargetSelect] = useState(false);

  const isMyTurn = gs.currentPlayerId === game.playerId;
  const isHost = game.playerId === room.hostId;
  const myPlayer = gs.players.find((p: ClientPlayer) => p.id === game.playerId);
  const opponents = gs.players.filter(
    (p: ClientPlayer) => p.id !== game.playerId,
  );
  const isActionPending = gs.pendingAction?.type === "delayed_effect";
  const hasPendingDefuse =
    gs.pendingAction?.type === "defuse_insert" &&
    gs.pendingAction.playerId === game.playerId;
  const hasPendingFavor =
    gs.pendingAction?.type === "favor_give" &&
    gs.pendingAction.playerId === game.playerId;

  // ── Card selection helpers ──────────────────────────────────────────────────
  const toggleCard = (cardId: string) => {
    if (hasPendingFavor) {
      game.giveCard(cardId);
      return;
    }
    setSelectedCards((prev) =>
      prev.includes(cardId)
        ? prev.filter((id) => id !== cardId)
        : [...prev, cardId],
    );
  };

  const getSelectedCardObjects = (): Card[] =>
    selectedCards
      .map((id) => gs.myHand.find((c) => c.id === id))
      .filter(Boolean) as Card[];

  const canPlaySelected = (): boolean => {
    const cards = getSelectedCardObjects();
    if (cards.length === 0) return false;

    // While waiting for Nope window — only Nope is playable
    if (gs.pendingAction?.type === "delayed_effect") {
      return cards.length === 1 && cards[0].type === CardType.NOPE;
    }

    // Nope can always be played (even out of turn)
    if (cards.length === 1 && cards[0].type === CardType.NOPE) return true;
    if (!isMyTurn) return false;

    // Single action cards
    if (cards.length === 1) {
      const t = cards[0].type;
      return [
        CardType.SKIP,
        CardType.ATTACK,
        CardType.SHUFFLE,
        CardType.SEE_THE_FUTURE,
        CardType.FAVOR,
      ].includes(t);
    }

    // Cat combos
    if (
      cards.length === 2 &&
      CAT_CARDS.includes(cards[0].type) &&
      cards[0].type === cards[1].type
    )
      return true;
    if (
      cards.length === 3 &&
      CAT_CARDS.includes(cards[0].type) &&
      cards.every((c) => c.type === cards[0].type)
    )
      return true;
    if (cards.length === 5) {
      const types = new Set(cards.map((c) => c.type));
      // Must be exactly 5 DIFFERENT cat types
      if (types.size === 5 && cards.every((c) => CAT_CARDS.includes(c.type)))
        return true;
    }
    return false;
  };

  const needsTarget = (): boolean => {
    const cards = getSelectedCardObjects();
    if (cards.length === 1 && cards[0].type === CardType.FAVOR) return true;
    if (cards.length >= 2 && cards.every((c) => CAT_CARDS.includes(c.type)))
      return true;
    return false;
  };

  const handlePlay = () => {
    if (needsTarget() && !targetPlayer) {
      setShowTargetSelect(true);
      return;
    }
    game.playCard(selectedCards, targetPlayer ?? undefined);
    setSelectedCards([]);
    setTargetPlayer(null);
    setShowTargetSelect(false);
  };

  const handleTargetSelect = (playerId: string) => {
    setTargetPlayer(playerId);
    setShowTargetSelect(false);
    game.playCard(selectedCards, playerId);
    setSelectedCards([]);
    setTargetPlayer(null);
  };

  const clearSelection = () => {
    setSelectedCards([]);
    setTargetPlayer(null);
  };

  const lastDiscardedCard =
    gs.discardPile.length > 0
      ? gs.discardPile[gs.discardPile.length - 1]
      : null;

  const sortedHand = isSorted
    ? [...gs.myHand].sort((a, b) => a.type.localeCompare(b.type))
    : gs.myHand;

  return (
    <>
      {game.error && <div className="error-toast">⚠️ {game.error}</div>}
      {game.eliminated && (
        <div className="eliminated-toast shake-anim">
          💥 {game.eliminated} bị loại!
        </div>
      )}

      {/* ── Header ── */}
      <div className="page-header">
        <h1>🐱💣 Mèo Nổ</h1>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span
            style={{
              fontSize: "12px",
              color: "var(--tet-text-muted)",
              marginRight: "8px",
            }}
            className="desktop-only"
          >
            {room.name}
          </span>
          <button
            className="btn btn-outline btn-sm mobile-only"
            onClick={() => setShowChat(true)}
            title="Chat"
          >
            💬
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={onShowHelp}
            title="Luật chơi"
          >
            ❓
          </button>
          <SoundToggle />
          <button
            className="btn btn-outline btn-sm"
            onClick={game.leaveRoom}
            title="Rời phòng"
          >
            🚪
          </button>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="game-layout">
        <div className="game-main">
          {/* Opponents */}
          <div className="game-top">
            {opponents.map((p: ClientPlayer) => {
              const av = AVATARS.find((a) => a.id === p.avatar);
              return (
                <div
                  key={p.id}
                  className={`opponent-slot ${gs.currentPlayerId === p.id ? "is-current-turn" : ""} ${!p.isAlive ? "is-dead" : ""} ${p.isDisconnected ? "is-disconnected" : ""}`}
                >
                  <span className="opponent-avatar">
                    {!p.isAlive ? (
                      <X size={24} color="#ef4444" />
                    ) : p.isDisconnected ? (
                      <RotateCcw size={24} color="#f59e0b" />
                    ) : av?.image ? (
                      <ImageWithFallback
                        src={av.image}
                        alt={p.name}
                        width={40}
                        height={40}
                      />
                    ) : (
                      <Cat size={20} />
                    )}
                  </span>
                  <span className="opponent-name">{p.name}</span>
                  <span className="opponent-cards">
                    {!p.isAlive ? (
                      "Bị loại"
                    ) : p.isDisconnected ? (
                      "Mất kết nối"
                    ) : (
                      <>
                        <span style={{ fontSize: 12 }}>🃏</span> {p.cardCount}
                      </>
                    )}
                  </span>
                  {gs.currentPlayerId === p.id && p.isAlive && (
                    <TurnTimer
                      remaining={game.turnTimeRemaining}
                      isMyTurn={false}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Deck & Discard */}
          <div className="game-center" style={{ position: "relative" }}>
            <div className="deck-area">
              <div
                className={`deck-pile ${game.lastDrawn ? "deck-drawing" : ""}`}
                onClick={
                  isMyTurn && !gs.pendingAction ? game.drawCard : undefined
                }
                style={{
                  cursor: isMyTurn && !gs.pendingAction ? "pointer" : "default",
                }}
              >
                <ImageWithFallback
                  src={CARD_BACK_IMAGE}
                  alt="Deck"
                  fill
                  style={{ objectFit: "cover", borderRadius: "14px" }}
                  priority
                />
                <span className="deck-count">{gs.deckCount}</span>
              </div>
              <span className="deck-label">
                {isMyTurn && !gs.pendingAction
                  ? `Bốc bài (còn ${gs.drawsRemaining} lần)`
                  : "Bộ bài"}
              </span>
            </div>

            <div className="discard-area">
              <div
                className={`discard-pile ${game.lastPlayedCards.length > 0 ? "discard-receiving" : ""}`}
              >
                {lastDiscardedCard ? (
                  <GameCard
                    card={lastDiscardedCard}
                    disabled
                    showTooltip={false}
                  />
                ) : (
                  <span style={{ opacity: 0.3 }}>
                    <RotateCcw size={32} />
                  </span>
                )}
              </div>
              <span className="deck-label">
                Bài đã đánh ({gs.discardPile.length})
              </span>
            </div>

            {/* Turn timer (my turn) */}
            {isMyTurn && !isActionPending && (
              <div className="center-timer">
                <TurnTimer remaining={game.turnTimeRemaining} isMyTurn={true} />
              </div>
            )}

            {/* Nope countdown overlay */}
            {isActionPending && (
              <div className="center-timer action-pending pulse-glow">
                <div className="turn-timer urgent">
                  <span className="timer-text" style={{ fontSize: "24px" }}>
                    ⏳
                  </span>
                </div>
                <div
                  style={{
                    background: "rgba(0,0,0,0.7)",
                    padding: "8px 16px",
                    borderRadius: "20px",
                    color: "#fff",
                    marginTop: "8px",
                  }}
                >
                  Cho phép <strong>NOPE!</strong> 🚫
                </div>
              </div>
            )}

            {/* Latest action log */}
            {game.actionLog.length > 0 && (
              <div className="action-log" key={game.actionLog.length}>
                {game.actionLog[game.actionLog.length - 1]}
              </div>
            )}
          </div>

          {/* My Hand */}
          <div className="game-bottom">
            <div className="hand-info">
              <span
                className="hand-label"
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                {(() => {
                  const av = AVATARS.find((a) => a.id === myPlayer?.avatar);
                  return av?.image ? (
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        overflow: "hidden",
                      }}
                    >
                      <ImageWithFallback
                        src={av.image}
                        alt=""
                        width={24}
                        height={24}
                      />
                    </div>
                  ) : (
                    <Cat size={16} />
                  );
                })()}
                {myPlayer?.name} • {gs.myHand.length} lá
              </span>
              <button
                className={`btn btn-sm ${isSorted ? "btn-gold" : "btn-outline"}`}
                onClick={() => setIsSorted(!isSorted)}
                title="Xếp bài theo loại"
                style={{ padding: "2px 8px", fontSize: "11px" }}
              >
                {isSorted ? "🔃 Đã xếp" : "🔃 Xếp bài"}
              </button>
            </div>

            {isMyTurn && (
              <div style={{ textAlign: "center", marginBottom: "4px" }}>
                <span className="turn-indicator pulse-glow">
                  🎯 Lượt của bạn!
                </span>
              </div>
            )}
            {hasPendingFavor && (
              <div style={{ textAlign: "center", marginBottom: "4px" }}>
                <span
                  className="turn-indicator"
                  style={{
                    background: "rgba(220, 38, 38, 0.2)",
                    color: "var(--tet-red)",
                  }}
                >
                  🧧 Chọn 1 lá bài để cho!
                </span>
              </div>
            )}
            {hasPendingDefuse && (
              <div style={{ textAlign: "center", marginBottom: "4px" }}>
                <span
                  className="turn-indicator"
                  style={{
                    background: "rgba(76, 175, 80, 0.2)",
                    color: "#4CAF50",
                  }}
                >
                  🧯 Chọn vị trí đặt Pháo Mèo!
                </span>
              </div>
            )}

            <div className="hand-cards">
              {sortedHand.map((card: Card, index: number) => (
                <GameCard
                  key={card.id}
                  card={card}
                  selected={selectedCards.includes(card.id)}
                  isPlaying={game.lastPlayedCards.includes(card.id)}
                  isDrawing={
                    game.lastDrawn &&
                    index === gs.myHand.length - 1 &&
                    !isSorted
                  }
                  onClick={() => toggleCard(card.id)}
                />
              ))}
            </div>

            <div className="hand-actions">
              {selectedCards.length > 0 && canPlaySelected() && (
                <button className="btn btn-gold" onClick={handlePlay}>
                  🃏 Chơi ({selectedCards.length} lá)
                </button>
              )}
              {selectedCards.length > 0 && (
                <button
                  className="btn btn-outline btn-sm"
                  onClick={clearSelection}
                >
                  ✕ Bỏ chọn
                </button>
              )}
              {isMyTurn && !gs.pendingAction && (
                <button className="btn btn-primary" onClick={game.drawCard}>
                  📥 Bốc Bài
                </button>
              )}
            </div>
          </div>
        </div>

        <ChatBox
          messages={game.messages}
          onSend={game.sendMessage}
          isOpen={showChat}
          onClose={() => setShowChat(false)}
        />
      </div>

      {/* ── Modals ── */}
      {showTargetSelect && (
        <TargetSelectModal
          opponents={opponents}
          onSelect={handleTargetSelect}
          onClose={() => setShowTargetSelect(false)}
        />
      )}

      {hasPendingDefuse && (
        <DefuseModal deckCount={gs.deckCount} onDefuse={game.defuse} />
      )}

      {game.futureCards && (
        <SeeFutureModal
          cards={game.futureCards}
          onClose={() => game.setFutureCards(null)}
        />
      )}

      {game.pickCards && (
        <PickCardModal
          cards={game.pickCards.cards}
          source={game.pickCards.source}
          onPick={game.pickCard}
        />
      )}

      {game.gameOver && (
        <GameOverModal
          gameOver={game.gameOver}
          isHost={isHost}
          onRestart={game.restartGame}
          onLeave={game.leaveRoom}
        />
      )}
    </>
  );
}
