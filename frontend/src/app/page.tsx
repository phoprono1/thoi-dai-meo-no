"use client";

import { useState, useEffect } from "react";
import { useGame } from "@/hooks/useGame";
import { AVATARS, ClientRoom } from "@/lib/types";
import SoundToggle from "@/components/SoundToggle";
import ImageWithFallback from "@/components/ImageWithFallback";
import { HelpModal } from "@/components/game/HelpModal";
import { WaitingRoom } from "@/components/game/WaitingRoom";
import { GameBoard } from "@/components/game/GameBoard";

export default function Home() {
  const game = useGame();
  const [playerName, setPlayerName] = useState("");
  const [playerAvatar, setPlayerAvatar] = useState("avatar_1");
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(5);

  // Auto-refresh rooms list every 3s when in lobby
  useEffect(() => {
    const interval = setInterval(() => {
      if (!game.currentRoom) game.refreshRooms();
    }, 3000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── View: Game Board ──────────────────────────────────────────────────────
  if (game.currentRoom && game.gameState) {
    return (
      <>
        <GameBoard game={game} onShowHelp={() => setShowHelp(true)} />
        {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      </>
    );
  }

  // ── View: Waiting Room ────────────────────────────────────────────────────
  if (game.currentRoom) {
    return (
      <>
        <WaitingRoom game={game} onShowHelp={() => setShowHelp(true)} />
        {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      </>
    );
  }

  // ── View: Lobby ───────────────────────────────────────────────────────────
  return (
    <>
      {game.error && <div className="error-toast">⚠️ {game.error}</div>}

      <div className="lobby-container">
        <div className="float-anim" style={{ fontSize: "64px" }}>
          🐱💣
        </div>
        <h1 className="lobby-title">Mèo Nổ Online</h1>
        <p className="lobby-subtitle">🎋 Phiên bản Tết Bính Ngọ 2026 🎋</p>

        {/* Player Setup */}
        <div className="lobby-panel">
          <h2>👤 Thông tin người chơi</h2>
          <div className="form-group">
            <label>Tên của bạn</label>
            <input
              className="input"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Nhập tên..."
              maxLength={20}
            />
          </div>
          <div className="form-group">
            <label>Chọn Avatar</label>
            <div className="avatar-grid">
              {AVATARS.map((av) => (
                <button
                  key={av.id}
                  className={`avatar-option ${playerAvatar === av.id ? "selected" : ""}`}
                  onClick={() => setPlayerAvatar(av.id)}
                  title={av.name}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      position: "relative",
                    }}
                  >
                    <ImageWithFallback
                      src={av.image!}
                      alt={av.name}
                      fill
                      className="avatar-image"
                      sizes="(max-width: 768px) 25vw, 100px"
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Room Actions */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            className="btn btn-gold btn-lg"
            onClick={() => setShowCreate(true)}
            disabled={!playerName.trim()}
          >
            🏠 Tạo Phòng
          </button>
          <button
            className="btn btn-outline btn-lg"
            onClick={() => game.refreshRooms()}
          >
            🔄 Làm Mới
          </button>
          <button
            className="btn btn-outline btn-lg"
            onClick={() => setShowHelp(true)}
          >
            ❓ Luật Chơi
          </button>
          <SoundToggle />
        </div>

        {/* Room List */}
        {game.rooms.length > 0 && (
          <div className="lobby-panel">
            <h2>🏠 Danh sách phòng ({game.rooms.length})</h2>
            <div className="room-list">
              {game.rooms.map((room: ClientRoom) => (
                <div key={room.id} className="room-item">
                  <div className="room-info">
                    <span className="room-name">
                      {room.hasPassword ? "🔒 " : ""}
                      {room.name}
                    </span>
                    <span className="room-meta">
                      {room.players.length}/{room.maxPlayers} người •{" "}
                      {room.status === "waiting"
                        ? "⏳ Đang chờ"
                        : room.status === "playing"
                          ? "🎮 Đang chơi"
                          : "✅ Kết thúc"}
                    </span>
                  </div>
                  {room.status === "waiting" &&
                    room.players.length < room.maxPlayers && (
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={!playerName.trim()}
                        onClick={() => {
                          if (room.hasPassword) {
                            setShowJoin(room.id);
                          } else {
                            game.joinRoom(playerName, playerAvatar, room.id);
                          }
                        }}
                      >
                        Vào
                      </button>
                    )}
                </div>
              ))}
            </div>
          </div>
        )}

        {game.rooms.length === 0 && (
          <p style={{ color: "var(--tet-text-muted)", fontSize: "14px" }}>
            Chưa có phòng nào. Hãy tạo phòng mới! 🎉
          </p>
        )}
      </div>

      {/* Help Modal */}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      {/* Create Room Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>🏠 Tạo Phòng Mới</h3>
            <div className="form-group">
              <label>Tên phòng</label>
              <input
                className="input"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="VD: Phòng Tết Vui Vẻ"
                maxLength={30}
              />
            </div>
            <div className="form-group">
              <label>Mật khẩu (tùy chọn)</label>
              <input
                className="input"
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                placeholder="Để trống nếu không cần"
                type="password"
              />
            </div>
            <div className="form-group">
              <label>Số người tối đa: {maxPlayers}</label>
              <input
                type="range"
                min={2}
                max={10}
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <button
                className="btn btn-gold"
                style={{ flex: 1 }}
                disabled={!roomName.trim()}
                onClick={() => {
                  game.createRoom(
                    playerName,
                    playerAvatar,
                    roomName,
                    roomPassword,
                    maxPlayers,
                  );
                  setShowCreate(false);
                }}
              >
                Tạo Phòng
              </button>
              <button
                className="btn btn-outline"
                onClick={() => setShowCreate(false)}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join with Password Modal */}
      {showJoin && (
        <div className="modal-overlay" onClick={() => setShowJoin(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>🔒 Nhập Mật Khẩu</h3>
            <div className="form-group">
              <input
                className="input"
                value={joinPassword}
                onChange={(e) => setJoinPassword(e.target.value)}
                placeholder="Nhập mật khẩu phòng..."
                type="password"
                autoFocus
              />
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="btn btn-gold"
                style={{ flex: 1 }}
                onClick={() => {
                  game.joinRoom(
                    playerName,
                    playerAvatar,
                    showJoin,
                    joinPassword,
                  );
                  setShowJoin(null);
                  setJoinPassword("");
                }}
              >
                Vào Phòng
              </button>
              <button
                className="btn btn-outline"
                onClick={() => setShowJoin(null)}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
