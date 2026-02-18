"use client";

import { useState } from "react";
import { AVATARS, ClientPlayer } from "@/lib/types";
import ImageWithFallback from "@/components/ImageWithFallback";
import SoundToggle from "@/components/SoundToggle";
import { Cat } from "lucide-react";
import { ChatBox } from "./ChatBox";
import { useGame } from "@/hooks/useGame";

interface Props {
  game: ReturnType<typeof useGame>;
  onShowHelp: () => void;
}

export function WaitingRoom({ game, onShowHelp }: Props) {
  const room = game.currentRoom!;
  const isHost = game.playerId === room.hostId;
  const [showChat, setShowChat] = useState(false);

  return (
    <>
      {game.error && <div className="error-toast">⚠️ {game.error}</div>}

      <div className="page-header">
        <h1>🐱💣 Mèo Nổ</h1>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className="btn btn-outline btn-sm desktop-only"
            onClick={() => setShowChat(true)}
            title="Chat"
          >
            💬
          </button>
          <button
            className="btn btn-outline btn-sm desktop-only"
            onClick={onShowHelp}
            title="Luật chơi"
          >
            ❓
          </button>
          <button
            className="btn btn-outline btn-sm mobile-only"
            onClick={onShowHelp}
            title="Luật chơi"
          >
            Luật
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={game.leaveRoom}
            title="Rời phòng"
          >
            🚪
          </button>
          <SoundToggle />
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div className="waiting-room" style={{ flex: 1 }}>
          <h2>🏠 {room.name}</h2>
          <div className="room-code">
            Mã phòng: <span>{room.id}</span>
          </div>

          <div className="player-grid">
            {room.players.map((p: ClientPlayer) => {
              const av = AVATARS.find((a) => a.id === p.avatar);
              return (
                <div
                  key={p.id}
                  className={`player-card ${p.id === room.hostId ? "is-host" : ""}`}
                >
                  <span className="player-avatar">
                    {av?.image ? (
                      <ImageWithFallback
                        src={av.image}
                        alt={p.name}
                        width={64}
                        height={64}
                        style={{ borderRadius: "50%" }}
                      />
                    ) : (
                      <Cat size={32} />
                    )}
                  </span>
                  <span className="player-name">{p.name}</span>
                  {p.id === room.hostId && (
                    <span className="player-badge">👑 Host</span>
                  )}
                </div>
              );
            })}
          </div>

          <p style={{ color: "var(--tet-text-muted)", fontSize: "14px" }}>
            {room.players.length}/{room.maxPlayers} người chơi
          </p>

          {isHost ? (
            <button
              className="btn btn-gold btn-lg"
              disabled={room.players.length < 2}
              onClick={game.startGame}
            >
              🎮 Bắt Đầu Chơi!
            </button>
          ) : (
            <p style={{ color: "var(--tet-gold-light)", fontSize: "14px" }}>
              ⏳ Đang chờ chủ phòng bắt đầu...
            </p>
          )}
        </div>

        <ChatBox
          messages={game.messages}
          onSend={game.sendMessage}
          isOpen={showChat}
          onClose={() => setShowChat(false)}
        />
      </div>
    </>
  );
}
