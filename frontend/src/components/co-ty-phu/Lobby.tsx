"use client";
import { useState } from "react";
import { ClientRoom } from "@/lib/coTyPhuData";
import HelpModal from "@/components/co-ty-phu/HelpModal";

interface Props {
  rooms: ClientRoom[];
  onCreateRoom: (
    name: string,
    playerName: string,
    avatar: string,
    maxPlayers: number,
    password?: string,
  ) => void;
  onJoinRoom: (
    roomId: string,
    playerName: string,
    avatar: string,
    password?: string,
  ) => void;
}

const TOKENS = [
  { key: "token-red", color: "#ef4444", label: "Đỏ" },
  { key: "token-blue", color: "#3b82f6", label: "Xanh" },
  { key: "token-green", color: "#22c55e", label: "Lá" },
  { key: "token-yellow", color: "#f59e0b", label: "Vàng" },
  { key: "token-purple", color: "#a855f7", label: "Tím" },
  { key: "token-orange", color: "#f97316", label: "Cam" },
];

/* ── Shared colours ── */
const BG0 = "#070f0a";
const BG1 = "#0d1a10";
const BG2 = "#122518";
const BORDER = "#1e3a26";
const GOLD = "#f59e0b";
const TEXTSUB = "#6b9e7a";

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  background: BG0,
  border: `1px solid ${BORDER}`,
  borderRadius: 8,
  padding: "9px 12px",
  color: "#e2e8f0",
  fontSize: 13,
  outline: "none",
};

/* ── Token avatar with fallback ── */
function TokenAvatar({
  tokenKey,
  color,
  size = 36,
}: {
  tokenKey: string;
  color: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
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
          src={`/assets/co-ty-phu/tokens/${tokenKey}.png`}
          alt={tokenKey}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={() => setFailed(true)}
        />
      ) : (
        <span style={{ fontSize: size * 0.45, color: "#fff", fontWeight: 700 }}>
          {tokenKey.split("-")[1]?.[0]?.toUpperCase()}
        </span>
      )}
    </div>
  );
}

/* ── Room card ── */
function RoomCard({
  room,
  canJoin,
  onJoin,
}: {
  room: ClientRoom;
  canJoin: boolean;
  onJoin: (id: string, hasPw: boolean) => void;
}) {
  const isFull = room.players.length >= room.maxPlayers;
  const fillPct = (room.players.length / room.maxPlayers) * 100;
  const host = room.players[0];
  const hostColor = TOKENS.find((t) => t.key === host?.avatar)?.color ?? "#888";

  return (
    <div
      style={{
        background: BG0,
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        transition: "border-color 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#2d5a3a")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = BORDER)}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {host && (
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              border: `2px solid ${hostColor}66`,
              overflow: "hidden",
              flexShrink: 0,
              backgroundColor: BG1,
            }}
          >
            <TokenAvatar tokenKey={host.avatar} color={hostColor} size={38} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span
              style={{
                fontWeight: 700,
                fontSize: 14,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {room.name}
            </span>
            {room.hasPassword && <span style={{ fontSize: 11 }}>🔒</span>}
          </div>
          <div style={{ fontSize: 11, color: TEXTSUB, marginTop: 1 }}>
            Chủ:{" "}
            <strong style={{ color: "#9dcfae" }}>{host?.name ?? "—"}</strong>
            &nbsp;·&nbsp;{room.players.length}/{room.maxPlayers} người
          </div>
        </div>
        <button
          onClick={() => onJoin(room.id, room.hasPassword)}
          disabled={!canJoin || isFull}
          style={{
            padding: "7px 16px",
            borderRadius: 8,
            background:
              isFull || !canJoin
                ? "#1e3a26"
                : "linear-gradient(135deg,#16a34a,#15803d)",
            border: "none",
            color: isFull || !canJoin ? "#3a6a4a" : "#fff",
            fontWeight: 700,
            fontSize: 12,
            cursor: isFull || !canJoin ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
            boxShadow: isFull || !canJoin ? "none" : "0 2px 8px #16a34a44",
            transition: "all 0.12s",
          }}
        >
          {isFull ? "Đầy" : "Vào →"}
        </button>
      </div>
      {/* Fill bar */}
      <div
        style={{
          height: 3,
          background: "#1a2e20",
          borderRadius: 99,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: 99,
            width: `${fillPct}%`,
            background: isFull
              ? "#ef4444"
              : "linear-gradient(90deg,#16a34a,#22c55e)",
            transition: "width 0.3s",
          }}
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════ MAIN ══════════════════════════════════════ */
export default function CoTyPhuLobby({
  rooms,
  onCreateRoom,
  onJoinRoom,
}: Props) {
  const [tab, setTab] = useState<"list" | "create">("list");
  const [showHelp, setShowHelp] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [selectedToken, setSelectedToken] = useState(TOKENS[0].key);
  const [roomName, setRoomName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [joinPassword, setJoinPassword] = useState("");
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);

  const tokenInfo = TOKENS.find((t) => t.key === selectedToken)!;
  const waitingRooms = rooms.filter((r) => r.status === "waiting");
  const canAct = playerName.trim().length > 0;

  const handleCreate = () => {
    if (!canAct) return;
    onCreateRoom(
      roomName.trim() || `Phòng của ${playerName.trim()}`,
      playerName.trim(),
      selectedToken,
      maxPlayers,
      password || undefined,
    );
  };

  const handleJoin = (roomId: string, hasPw: boolean) => {
    if (!canAct) return;
    if (hasPw) setJoiningRoomId(roomId);
    else onJoinRoom(roomId, playerName.trim(), selectedToken);
  };

  const handleJoinWithPw = () => {
    if (!joiningRoomId || !canAct) return;
    onJoinRoom(joiningRoomId, playerName.trim(), selectedToken, joinPassword);
    setJoiningRoomId(null);
    setJoinPassword("");
  };

  return (
    <div
      className="ctp-lobby"
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
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      {/* ── Header ── */}
      <div
        style={{ textAlign: "center", marginBottom: 28, position: "relative" }}
      >
        <button
          onClick={() => setShowHelp(true)}
          title="Hướng dẫn"
          style={{
            position: "absolute",
            top: 0,
            right: -40,
            width: 28,
            height: 28,
            borderRadius: "50%",
            border: "1px solid #1e3a26",
            background: "rgba(255,255,255,0.05)",
            color: "#6b9e7a",
            cursor: "pointer",
            fontSize: 13,
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
            fontSize: 56,
            lineHeight: 1,
            marginBottom: 8,
            filter: "drop-shadow(0 0 20px #f59e0b88)",
          }}
        >
          🏦
        </div>
        <h1
          style={{
            fontSize: 34,
            fontWeight: 800,
            letterSpacing: "-0.5px",
            background: "linear-gradient(135deg,#fde68a,#f59e0b,#d97706)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            margin: 0,
          }}
        >
          Cờ Tỷ Phú
        </h1>
        <p style={{ color: TEXTSUB, fontSize: 13, marginTop: 4 }}>
          Phiên bản Việt Nam · Monopoly
        </p>
      </div>

      {/* ── Card ── */}
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: BG1,
          border: `1px solid ${BORDER}`,
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
      >
        {/* ── Player identity ── */}
        <div
          style={{ padding: "18px 20px", borderBottom: `1px solid ${BORDER}` }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: TEXTSUB,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Thông tin của bạn
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {/* Live avatar preview */}
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: "50%",
                border: `2px solid ${tokenInfo.color}`,
                boxShadow: `0 0 14px ${tokenInfo.color}55`,
                overflow: "hidden",
                flexShrink: 0,
                backgroundColor: BG0,
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
            >
              <TokenAvatar
                tokenKey={selectedToken}
                color={tokenInfo.color}
                size={54}
              />
            </div>
            <div style={{ flex: 1 }}>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Nhập tên người chơi..."
                maxLength={20}
                style={{ ...inputStyle, marginBottom: 8 }}
                onFocus={(e) => (e.target.style.borderColor = GOLD)}
                onBlur={(e) => (e.target.style.borderColor = BORDER)}
              />
              <div style={{ display: "flex", gap: 6 }}>
                {TOKENS.map((t) => {
                  const active = t.key === selectedToken;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setSelectedToken(t.key)}
                      title={t.label}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        border: `2px solid ${active ? t.color : "#2d4a35"}`,
                        padding: 1,
                        background: active ? `${t.color}22` : "transparent",
                        transform: active ? "scale(1.18)" : "scale(1)",
                        transition: "all 0.15s",
                        cursor: "pointer",
                        overflow: "hidden",
                        boxShadow: active ? `0 0 8px ${t.color}88` : "none",
                      }}
                    >
                      <TokenAvatar tokenKey={t.key} color={t.color} size={26} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          {!canAct && (
            <div
              style={{
                marginTop: 8,
                fontSize: 11,
                color: "#f87171",
                textAlign: "center",
              }}
            >
              ⚠️ Nhập tên trước khi tạo hoặc vào phòng
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}` }}>
          {(
            [
              { key: "list", label: `📋 Danh sách (${waitingRooms.length})` },
              { key: "create", label: "➕ Tạo phòng" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1,
                padding: "11px 0",
                fontSize: 13,
                fontWeight: 600,
                color: tab === t.key ? GOLD : TEXTSUB,
                background: tab === t.key ? BG2 : "transparent",
                outline: "none",
                borderTop: "none",
                borderLeft: "none",
                borderRight: "none",
                borderBottom: `2px solid ${tab === t.key ? GOLD : "transparent"}`,
                transition: "all 0.15s",
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div style={{ padding: 20 }}>
          {/* LIST */}
          {tab === "list" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {waitingRooms.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 0",
                    color: TEXTSUB,
                    fontSize: 13,
                  }}
                >
                  <div style={{ fontSize: 36, marginBottom: 10 }}>🏠</div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    Chưa có phòng nào
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    Hãy tạo phòng mới và mời bạn bè vào!
                  </div>
                </div>
              ) : (
                waitingRooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    canJoin={canAct}
                    onJoin={handleJoin}
                  />
                ))
              )}
            </div>
          )}

          {/* CREATE */}
          {tab === "create" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label
                  style={{
                    fontSize: 11,
                    color: TEXTSUB,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: 5,
                  }}
                >
                  Tên phòng
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder={`Phòng của ${playerName || "bạn"}...`}
                  maxLength={40}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = GOLD)}
                  onBlur={(e) => (e.target.style.borderColor = BORDER)}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: 11,
                    color: TEXTSUB,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  Số người chơi
                </label>
                <div style={{ display: "flex", gap: 6 }}>
                  {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <button
                      key={n}
                      onClick={() => setMaxPlayers(n)}
                      style={{
                        flex: 1,
                        padding: "7px 0",
                        borderRadius: 8,
                        border: `1px solid ${maxPlayers === n ? GOLD : BORDER}`,
                        background: maxPlayers === n ? `${GOLD}22` : BG0,
                        color: maxPlayers === n ? GOLD : TEXTSUB,
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: "pointer",
                        transition: "all 0.12s",
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  style={{
                    fontSize: 11,
                    color: TEXTSUB,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: 5,
                  }}
                >
                  Mật khẩu{" "}
                  <span
                    style={{
                      fontWeight: 400,
                      textTransform: "none",
                      color: "#4a7a5a",
                    }}
                  >
                    (bỏ trống = công khai)
                  </span>
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Không đặt mật khẩu..."
                    style={{ ...inputStyle, paddingRight: 40 }}
                    onFocus={(e) => (e.target.style.borderColor = GOLD)}
                    onBlur={(e) => (e.target.style.borderColor = BORDER)}
                  />
                  <button
                    onClick={() => setShowPw((v) => !v)}
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: TEXTSUB,
                      fontSize: 14,
                    }}
                  >
                    {showPw ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div
                style={{
                  background: BG0,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 10,
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    border: `2px solid ${tokenInfo.color}`,
                    overflow: "hidden",
                    backgroundColor: BG1,
                  }}
                >
                  <TokenAvatar
                    tokenKey={selectedToken}
                    color={tokenInfo.color}
                    size={38}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {playerName || "Tên người chơi"}
                  </div>
                  <div style={{ fontSize: 11, color: TEXTSUB }}>
                    {roomName.trim() || `Phòng của ${playerName || "bạn"}`} ·{" "}
                    {maxPlayers} người{password ? " · 🔒" : ""}
                  </div>
                </div>
              </div>

              <button
                onClick={handleCreate}
                disabled={!canAct}
                style={{
                  padding: "13px 0",
                  borderRadius: 12,
                  fontWeight: 800,
                  fontSize: 15,
                  letterSpacing: "0.02em",
                  background: canAct
                    ? "linear-gradient(135deg,#f59e0b,#d97706)"
                    : "#1e3a26",
                  color: canAct ? "#000" : "#3a6a4a",
                  border: "none",
                  cursor: canAct ? "pointer" : "not-allowed",
                  transition: "all 0.15s",
                  boxShadow: canAct ? "0 4px 16px #f59e0b44" : "none",
                }}
              >
                🏦 Tạo phòng &amp; Vào phòng chờ
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Password modal ── */}
      {joiningRoomId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: BG1,
              border: `1px solid ${BORDER}`,
              borderRadius: 16,
              padding: 24,
              width: 300,
              boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 4 }}>🔒</div>
            <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700 }}>
              Phòng có mật khẩu
            </h3>
            <p style={{ margin: "0 0 14px", fontSize: 12, color: TEXTSUB }}>
              Nhập mật khẩu để vào phòng này
            </p>
            <input
              type="password"
              value={joinPassword}
              onChange={(e) => setJoinPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoinWithPw()}
              placeholder="Mật khẩu..."
              autoFocus
              style={{ ...inputStyle, marginBottom: 12 }}
              onFocus={(e) => (e.target.style.borderColor = GOLD)}
              onBlur={(e) => (e.target.style.borderColor = BORDER)}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => {
                  setJoiningRoomId(null);
                  setJoinPassword("");
                }}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  borderRadius: 8,
                  background: BG2,
                  border: `1px solid ${BORDER}`,
                  color: "#e2e8f0",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleJoinWithPw}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  borderRadius: 8,
                  background: "linear-gradient(135deg,#16a34a,#15803d)",
                  border: "none",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px #16a34a44",
                }}
              >
                Vào phòng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
