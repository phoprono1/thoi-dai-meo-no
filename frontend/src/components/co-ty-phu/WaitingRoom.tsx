"use client";
import { useState } from "react";
import { ClientRoom } from "@/lib/coTyPhuData";
import HelpModal from "@/components/co-ty-phu/HelpModal";

interface Props {
  room: ClientRoom;
  myPlayerId: string;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

const TOKEN_COLORS: Record<string, string> = {
  "token-red": "#ef4444",
  "token-blue": "#3b82f6",
  "token-green": "#22c55e",
  "token-yellow": "#f59e0b",
  "token-purple": "#a855f7",
  "token-orange": "#f97316",
};

const BG0 = "#070f0a";
const BG1 = "#0d1a10";
const BG2 = "#122518";
const BORDER = "#1e3a26";
const GOLD = "#f59e0b";
const TEXTSUB = "#6b9e7a";

function PlayerAvatar({
  avatar,
  size = 40,
}: {
  avatar: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const color = TOKEN_COLORS[avatar] ?? "#555";
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: failed ? color : "transparent",
        overflow: "hidden",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {!failed ? (
        <img
          src={`/assets/co-ty-phu/tokens/${avatar}.png`}
          alt={avatar}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={() => setFailed(true)}
        />
      ) : (
        <span style={{ fontSize: size * 0.42, color: "#fff", fontWeight: 700 }}>
          {avatar?.split("-")[1]?.[0]?.toUpperCase()}
        </span>
      )}
    </div>
  );
}

export default function CoTyPhuWaitingRoom({
  room,
  myPlayerId,
  onStartGame,
  onLeaveRoom,
}: Props) {
  const isHost = room.hostId === myPlayerId;
  const canStart = isHost && room.players.length >= 2;
  const fillPct = (room.players.length / room.maxPlayers) * 100;
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div
      className="ctp-waiting"
      style={{
        minHeight: "100dvh",
        background: `radial-gradient(ellipse at 50% 0%, #0d2a18 0%, ${BG0} 65%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "40px 16px 40px",
        color: "#e2e8f0",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: BG1,
          border: `1px solid ${BORDER}`,
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
      >
        {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

        {/* ── Header ── */}
        <div
          style={{
            background: `linear-gradient(135deg, #0d2a18, ${BG2})`,
            padding: "22px 20px 18px",
            borderBottom: `1px solid ${BORDER}`,
            textAlign: "center",
            position: "relative",
          }}
        >
          <button
            onClick={() => setShowHelp(true)}
            title="Hướng dẫn"
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              width: 26,
              height: 26,
              borderRadius: "50%",
              border: "1px solid #1e3a26",
              background: "rgba(255,255,255,0.05)",
              color: "#6b9e7a",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ?
          </button>
          <div
            style={{
              fontSize: 40,
              lineHeight: 1,
              marginBottom: 8,
              filter: "drop-shadow(0 0 16px #f59e0b88)",
            }}
          >
            🏦
          </div>
          <h2
            style={{
              margin: "0 0 4px",
              fontSize: 20,
              fontWeight: 800,
              background: "linear-gradient(135deg,#fde68a,#f59e0b)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {room.name}
          </h2>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginTop: 4,
            }}
          >
            <span style={{ fontSize: 11, color: TEXTSUB }}>ID phòng:</span>
            <code
              style={{
                fontSize: 11,
                color: "#9dcfae",
                background: BG0,
                padding: "2px 8px",
                borderRadius: 6,
                letterSpacing: "0.08em",
                border: `1px solid ${BORDER}`,
              }}
            >
              {room.id}
            </code>
            {room.hasPassword && <span style={{ fontSize: 12 }}>🔒</span>}
          </div>
        </div>

        {/* ── Player counter + bar ── */}
        <div style={{ padding: "14px 20px 0" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: TEXTSUB,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Người chơi
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: room.players.length >= 2 ? "#4ade80" : GOLD,
              }}
            >
              {room.players.length} / {room.maxPlayers}
            </span>
          </div>
          <div
            style={{
              height: 4,
              background: "#1a2e20",
              borderRadius: 99,
              overflow: "hidden",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 99,
                width: `${fillPct}%`,
                background: "linear-gradient(90deg,#16a34a,#4ade80)",
                transition: "width 0.4s",
              }}
            />
          </div>
        </div>

        {/* ── Player list ── */}
        <div
          style={{
            padding: "0 20px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {room.players.map((p) => {
            const tokenColor = TOKEN_COLORS[p.avatar] ?? "#888";
            const isMe = p.id === myPlayerId;
            const isRoomHost = p.id === room.hostId;
            return (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: isMe ? `${tokenColor}11` : BG0,
                  border: `1px solid ${isMe ? tokenColor + "44" : BORDER}`,
                  borderRadius: 10,
                  padding: "9px 12px",
                  transition: "all 0.15s",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    border: `2px solid ${tokenColor}`,
                    boxShadow: isMe ? `0 0 10px ${tokenColor}55` : "none",
                    overflow: "hidden",
                    backgroundColor: BG1,
                    flexShrink: 0,
                  }}
                >
                  <PlayerAvatar avatar={p.avatar} size={40} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 5 }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 14,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.name}
                    </span>
                    {isMe && (
                      <span
                        style={{
                          fontSize: 10,
                          color: "#4ade80",
                          background: "#16a34a22",
                          border: "1px solid #16a34a44",
                          borderRadius: 4,
                          padding: "1px 5px",
                          fontWeight: 600,
                        }}
                      >
                        bạn
                      </span>
                    )}
                  </div>
                  {isRoomHost && (
                    <div style={{ fontSize: 11, color: GOLD, marginTop: 1 }}>
                      👑 Chủ phòng
                    </div>
                  )}
                </div>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#4ade80",
                    boxShadow: "0 0 6px #4ade8088",
                    flexShrink: 0,
                  }}
                />
              </div>
            );
          })}

          {/* Empty slots */}
          {Array.from({ length: room.maxPlayers - room.players.length }).map(
            (_, i) => (
              <div
                key={`empty-${i}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "transparent",
                  border: `1px dashed ${BORDER}`,
                  borderRadius: 10,
                  padding: "9px 12px",
                  opacity: 0.5,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: BG0,
                    border: `1px solid ${BORDER}`,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ fontSize: 16, opacity: 0.4 }}>?</span>
                </div>
                <span style={{ fontSize: 13, color: TEXTSUB }}>
                  Đang chờ...
                </span>
              </div>
            ),
          )}
        </div>

        {/* ── Actions ── */}
        <div
          style={{
            padding: "0 20px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {!isHost && (
            <div
              style={{
                textAlign: "center",
                padding: "10px 0",
                fontSize: 13,
                color: TEXTSUB,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: GOLD,
                  animation: "pulse 2s infinite",
                }}
              />
              Đang chờ chủ phòng bắt đầu...
            </div>
          )}

          {isHost && (
            <button
              onClick={onStartGame}
              disabled={!canStart}
              style={{
                padding: "13px 0",
                borderRadius: 12,
                fontWeight: 800,
                fontSize: 15,
                background: canStart
                  ? "linear-gradient(135deg,#f59e0b,#d97706)"
                  : BG2,
                color: canStart ? "#000" : "#3a6a4a",
                border: "none",
                cursor: canStart ? "pointer" : "not-allowed",
                boxShadow: canStart ? "0 4px 16px #f59e0b44" : "none",
                transition: "all 0.15s",
              }}
            >
              {canStart
                ? "🎲 Bắt đầu trận đấu!"
                : `⏳ Cần ít nhất 2 người (${room.players.length}/2)`}
            </button>
          )}

          <button
            onClick={onLeaveRoom}
            style={{
              padding: "11px 0",
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 13,
              background: "transparent",
              color: "#f87171",
              border: `1px solid #3a1a1a`,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#3a1a1a";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            ← Rời phòng
          </button>
        </div>
      </div>
    </div>
  );
}
