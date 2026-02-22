"use client";

import Image from "next/image";
import { useMaSoi } from "@/hooks/useMaSoi";
import Lobby from "@/components/ma-soi/Lobby";
import WaitingRoom from "@/components/ma-soi/WaitingRoom";
import GameView from "@/components/ma-soi/GameView";
import {
  ROLE_DEFS,
  TEAM_LABELS,
  WIN_BACKGROUND,
  Team,
  PlayerStatus,
} from "@/lib/maSoiData";

export default function MaSoiPage() {
  const {
    view,
    playerId,
    playerName,
    playerAvatar,
    room,
    roomList,
    game,
    secondsLeft,
    chatMessages,
    wolfChatMessages,
    deadChatMessages,
    seerHistory,
    error,
    notification,
    fetchRooms,
    createRoom,
    joinRoom,
    leaveRoom,
    kickPlayer,
    updateConfig,
    startGame,
    submitNightAction,
    castVote,
    unVote,
    hunterShoot,
    sendChat,
    sendWolfChat,
    sendDeadChat,
    setPlayerName,
    setPlayerAvatar,
    dismissNotification,
  } = useMaSoi();

  return (
    <div className="relative">
      {/* Notification toast */}
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 border border-white/20 text-white text-sm px-4 py-2 rounded-xl shadow-xl flex items-center gap-3">
          <span>{notification}</span>
          <button
            onClick={dismissNotification}
            className="text-white/50 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {view === "lobby" && (
        <Lobby
          roomList={roomList}
          playerName={playerName}
          playerAvatar={playerAvatar}
          error={error}
          onSetName={setPlayerName}
          onSetAvatar={setPlayerAvatar}
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          onFetchRooms={fetchRooms}
        />
      )}

      {view === "waiting_room" && room && (
        <WaitingRoom
          room={room}
          playerId={playerId}
          error={error}
          onLeave={leaveRoom}
          onKick={kickPlayer}
          onUpdateConfig={updateConfig}
          onStartGame={startGame}
        />
      )}

      {view === "game" && game && (
        <GameView
          game={game}
          playerId={playerId}
          secondsLeft={secondsLeft}
          chatMessages={chatMessages}
          wolfChatMessages={wolfChatMessages}
          deadChatMessages={deadChatMessages}
          seerHistory={seerHistory}
          onNightAction={submitNightAction}
          onVote={castVote}
          onUnvote={unVote}
          onHunterShoot={hunterShoot}
          onSendChat={sendChat}
          onSendWolfChat={sendWolfChat}
          onSendDeadChat={sendDeadChat}
        />
      )}

      {view === "game_over" && game && (
        <GameOverScreen
          game={game}
          playerId={playerId}
          onReturnToLobby={leaveRoom}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// GAME OVER SCREEN
// ─────────────────────────────────────────────

type GameState = ReturnType<typeof useMaSoi>["game"];

function GameOverScreen({
  game,
  playerId,
  onReturnToLobby,
}: {
  game: NonNullable<GameState>;
  playerId: string | null;
  onReturnToLobby: () => void;
}) {
  const winner = game.winner;
  const bgPath = winner
    ? (WIN_BACKGROUND[winner] ?? WIN_BACKGROUND.default)
    : WIN_BACKGROUND.default;
  const me = game.players.find((p) => p.id === playerId);
  const didIWin = me ? game.winnerIds.includes(me.id) : false;

  const winnerBadge =
    winner === Team.VILLAGE
      ? "/assets/ma-soi/ui/badge-village.png"
      : winner === Team.WEREWOLF
        ? "/assets/ma-soi/ui/badge-wolf.png"
        : "/assets/ma-soi/ui/badge-solo.png";

  return (
    <div
      className="min-h-screen bg-cover bg-center text-white"
      style={{ backgroundImage: `url('${bgPath}')` }}
    >
      <div className="min-h-screen bg-black/65 flex flex-col items-center justify-center p-4 sm:p-6 text-center">
        {/* Winner badge */}
        <Image
          src={winnerBadge}
          alt={winner ?? "kết thúc"}
          width={80}
          height={80}
          className="mb-4 drop-shadow-2xl"
        />
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-wide mb-2">
          {winner ? TEAM_LABELS[winner] : "Kết thúc"} thắng!
        </h1>
        {didIWin ? (
          <div className="flex items-center justify-center gap-2 text-green-400 font-bold text-lg mb-6">
            <Image
              src="/assets/ma-soi/ui/heart.png"
              alt="thắng"
              width={22}
              height={22}
            />
            <span>Bạn đã thắng!</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-red-400 font-bold text-lg mb-6">
            <Image
              src="/assets/ma-soi/ui/heart-broken.png"
              alt="thua"
              width={22}
              height={22}
            />
            <span>Bạn đã thua…</span>
          </div>
        )}

        {/* Player reveal table */}
        <div className="w-full max-w-xl bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-6">
          <p className="text-xs uppercase tracking-widest text-white/40 mb-3">
            Tất cả người chơi
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {game.players.map((player) => {
              const roleDef = player.role ? ROLE_DEFS[player.role] : null;
              const isWinner = game.winnerIds.includes(player.id);
              const isDead = player.status === PlayerStatus.DEAD;
              return (
                <div
                  key={player.id}
                  className={`rounded-xl p-3 flex flex-col items-center gap-1.5 text-center border ${
                    isWinner
                      ? "border-yellow-400/60 bg-yellow-500/15"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  {/* Avatar + winner/dead overlay */}
                  <div className="relative">
                    <Image
                      src={
                        player.avatar ||
                        "/assets/ma-soi/ui/avatars/avatar-1.png"
                      }
                      alt={player.name}
                      width={44}
                      height={44}
                      className={`rounded-full ${isDead ? "grayscale opacity-60" : ""}`}
                    />
                    {isWinner && (
                      <div className="absolute -top-1.5 -right-1.5">
                        <Image
                          src="/assets/ma-soi/ui/crown.png"
                          alt="thắng"
                          width={18}
                          height={18}
                        />
                      </div>
                    )}
                    {isDead && (
                      <div className="absolute -bottom-1 -right-1">
                        <Image
                          src="/assets/ma-soi/ui/skull.png"
                          alt="chết"
                          width={16}
                          height={16}
                        />
                      </div>
                    )}
                  </div>
                  <span className="font-semibold truncate w-full text-xs">
                    {player.name}
                  </span>
                  {/* Role reveal */}
                  {roleDef ? (
                    <div className="flex flex-col items-center gap-1">
                      <Image
                        src={roleDef.image}
                        alt={roleDef.name}
                        width={36}
                        height={36}
                        className="rounded-lg shadow"
                      />
                      <span className="text-[10px] text-white/70">
                        {roleDef.name}
                      </span>
                    </div>
                  ) : (
                    <Image
                      src="/assets/ma-soi/roles/card-back.png"
                      alt="ẩn"
                      width={36}
                      height={36}
                      className="rounded-lg opacity-40"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={onReturnToLobby}
          className="bg-white/10 hover:bg-white/20 border border-white/20 font-semibold px-8 py-3 rounded-xl transition-all text-sm"
        >
          ↩ Quay về sảnh chờ
        </button>
      </div>
    </div>
  );
}
