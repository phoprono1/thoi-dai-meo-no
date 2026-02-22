"use client";
import { useState, useRef, useEffect } from "react";
import { useCoTyPhu } from "@/hooks/useCoTyPhu";
import Board from "@/components/co-ty-phu/Board";
import ActionPanel from "@/components/co-ty-phu/ActionPanel";
import ChatBox from "@/components/co-ty-phu/ChatBox";
import CoTyPhuLobby from "@/components/co-ty-phu/Lobby";
import CoTyPhuWaitingRoom from "@/components/co-ty-phu/WaitingRoom";
import HelpModal from "@/components/co-ty-phu/HelpModal";
import { formatMoney } from "@/lib/coTyPhuData";
import Link from "next/link";

export default function CoTyPhuPage() {
  const [showHelp, setShowHelp] = useState(false);
  const {
    rooms,
    currentRoom,
    playerId,
    gameState,
    messages,
    error,
    gameOver,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    rollDice,
    buyProperty,
    skipBuy,
    buildAction,
    mortgageAction,
    sellProperty,
    payJail,
    useJailCard,
    endTurn,
    surrender,
    sendChat,
  } = useCoTyPhu();

  const myPlayer = gameState?.players.find((p) => p.id === playerId);
  const myName = myPlayer?.name ?? "";

  // ── Views ────────────────────────────────────────────────────
  if (!currentRoom) {
    return (
      <>
        <div className="fixed top-3 left-3 z-10">
          <Link
            href="/"
            className="bg-gray-800/80 backdrop-blur text-gray-300 hover:text-white text-sm px-3 py-1.5 rounded-lg border border-gray-700 transition-colors"
          >
            ← Hub
          </Link>
        </div>
        {error && <ErrorToast msg={error} />}
        <CoTyPhuLobby
          rooms={rooms}
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
        />
      </>
    );
  }

  if (currentRoom.status === "waiting" && !gameState) {
    return (
      <>
        {error && <ErrorToast msg={error} />}
        <CoTyPhuWaitingRoom
          room={currentRoom}
          myPlayerId={playerId ?? ""}
          onStartGame={startGame}
          onLeaveRoom={leaveRoom}
        />
      </>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-4xl mb-3 animate-spin">🎲</div>
          <div>Đang tải trận đấu...</div>
        </div>
      </div>
    );
  }

  // ── Game board ───────────────────────────────────────────────
  return (
    <div className="ctp-root h-dvh bg-gray-950 text-white flex flex-col overflow-hidden">
      {error && <ErrorToast msg={error} />}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {gameOver && (
        <GameOverModal
          winnerId={gameOver.winnerId}
          winnerName={gameOver.winnerName}
          myPlayerId={playerId ?? ""}
          onReturnLobby={leaveRoom}
        />
      )}

      {/* Top bar */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center gap-3 flex-shrink-0">
        <Link href="/" className="text-gray-400 hover:text-white text-sm">
          ← Hub
        </Link>
        <div className="text-yellow-400 font-bold">🏦 Cờ Tỷ Phú</div>
        <div className="hidden sm:block text-gray-500 text-xs">
          Phòng: {currentRoom.id}
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setShowHelp(true)}
          title="Hướng dẫn"
          className="text-gray-400 hover:text-yellow-400 transition-colors text-sm w-7 h-7 rounded-full border border-gray-700 hover:border-yellow-600 flex items-center justify-center flex-shrink-0"
        >
          ?
        </button>
        {gameState.players.map((p) => (
          <div
            key={p.id}
            className={`flex items-center gap-1 text-xs ${p.isBankrupt ? "opacity-40" : ""}`}
          >
            <div className="w-5 h-5 rounded-full overflow-hidden border border-gray-500 flex-shrink-0">
              <img
                src={`/assets/co-ty-phu/tokens/${p.avatar}.png`}
                alt={p.avatar}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
            <span className="hidden sm:inline text-gray-300 text-xs truncate max-w-[48px]">
              {p.name}
            </span>
            <span
              className={
                "hidden sm:inline " +
                (p.id === gameState.currentPlayerId
                  ? "text-yellow-300 font-bold"
                  : "text-gray-400")
              }
            >
              {formatMoney(p.money)}
            </span>
          </div>
        ))}
      </div>

      {/* Main layout */}
      <div className="ctp-game-layout">
        <div className="ctp-board-wrap">
          <BoardScaler>
            <Board gameState={gameState} myPlayerId={playerId ?? ""} />
          </BoardScaler>
        </div>
        <div className="ctp-sidebar">
          <ActionPanel
            gameState={gameState}
            myPlayerId={playerId ?? ""}
            onRollDice={rollDice}
            onBuyProperty={buyProperty}
            onSkipBuy={skipBuy}
            onBuild={buildAction}
            onMortgage={mortgageAction}
            onSellProperty={sellProperty}
            onPayJail={payJail}
            onUseJailCard={useJailCard}
            onEndTurn={endTurn}
            onSurrender={surrender}
          />
          <ChatBox messages={messages} onSend={sendChat} myName={myName} />
        </div>
      </div>
    </div>
  );
}

const BOARD_SIZE = 756;

function BoardScaler({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth;
        setScale(Math.min(1, w / BOARD_SIZE));
      }
    };
    update();
    const observer = new ResizeObserver(update);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const scaled = Math.round(BOARD_SIZE * scale);
  return (
    <div ref={containerRef} style={{ width: "100%" }}>
      <div
        style={{
          width: scaled,
          height: scaled,
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            width: BOARD_SIZE,
            height: BOARD_SIZE,
            ["--board-scale" as string]: scale,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function ErrorToast({ msg }: { msg: string }) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-xl pointer-events-none">
      ⚠️ {msg}
    </div>
  );
}

function GameOverModal({
  winnerId,
  winnerName,
  myPlayerId,
  onReturnLobby,
}: {
  winnerId: string;
  winnerName: string;
  myPlayerId: string;
  onReturnLobby: () => void;
}) {
  const isWinner = winnerId === myPlayerId;
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl p-8 text-center max-w-sm w-full shadow-2xl border border-gray-700">
        <div className="text-6xl mb-4">{isWinner ? "🏆" : "💸"}</div>
        <h2 className="text-2xl font-bold text-yellow-400 mb-2">
          {isWinner ? "Bạn đã thắng!" : "Trận đấu kết thúc!"}
        </h2>
        <p className="text-gray-300 mb-6">
          {isWinner
            ? "Chúc mừng! Bạn là tỷ phú số 1!"
            : `${winnerName} đã chiến thắng!`}
        </p>
        <button
          onClick={onReturnLobby}
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-6 rounded-xl transition-colors"
        >
          🏠 Về Lobby
        </button>
      </div>
    </div>
  );
}
