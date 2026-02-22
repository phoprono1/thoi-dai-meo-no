"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  ClientMaSoiGameState,
  ClientMaSoiPlayer,
  GamePhase,
  PlayerStatus,
  ROLE_DEFS,
  PHASE_INFO,
  RoleId,
  Team,
  TEAM_LABELS,
  ChatMessage,
  DayVote,
  isNightPhase,
} from "@/lib/maSoiData";

interface GameViewProps {
  game: ClientMaSoiGameState;
  playerId: string | null;
  secondsLeft: number;
  chatMessages: ChatMessage[];
  wolfChatMessages: ChatMessage[];
  deadChatMessages: ChatMessage[];
  seerHistory: { round: number; targetId: string; isWolf: boolean }[];
  onNightAction: (phase: GamePhase, payload: object) => void;
  onVote: (targetId: string) => void;
  onUnvote: () => void;
  onHunterShoot: (targetId: string) => void;
  onSendChat: (msg: string) => void;
  onSendWolfChat: (msg: string) => void;
  onSendDeadChat: (msg: string) => void;
}

export default function GameView({
  game,
  playerId,
  secondsLeft,
  chatMessages,
  wolfChatMessages,
  deadChatMessages,
  seerHistory,
  onNightAction,
  onVote,
  onUnvote,
  onHunterShoot,
  onSendChat,
  onSendWolfChat,
  onSendDeadChat,
}: GameViewProps) {
  const me = game.players.find((p) => p.id === playerId) ?? null;
  const isAlive = me?.status === PlayerStatus.ALIVE;
  const phase = game.phase;
  const isNight = isNightPhase(phase);
  const phaseInfo = PHASE_INFO[phase];
  const bgName = phaseInfo?.bg ?? "night";
  const bgPath = `/assets/ma-soi/backgrounds/${bgName}.jpg`;

  // Night action state
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [witchPotion, setWitchPotion] = useState<"save" | "kill" | "none">(
    "none",
  );
  const [actionSubmitted, setActionSubmitted] = useState(false);

  // Chat
  const [chatTab, setChatTab] = useState<"public" | "wolf" | "dead">("public");
  const [chatInput, setChatInput] = useState("");

  // Log
  const [showLog, setShowLog] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  // Mobile chat
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [mobileUnread, setMobileUnread] = useState(0);
  const prevMsgCountRef = useRef(0);

  // Reset action state on phase change
  useEffect(() => {
    setSelectedTarget(null);
    setSelectedTargets([]);
    setWitchPotion("none");
    setActionSubmitted(false);
  }, [phase]);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [game.log]);

  // Track unread messages for mobile chat button
  useEffect(() => {
    const total =
      chatMessages.length + wolfChatMessages.length + deadChatMessages.length;
    if (!showMobileChat && total > prevMsgCountRef.current) {
      setMobileUnread((u) => u + total - prevMsgCountRef.current);
    }
    prevMsgCountRef.current = total;
  }, [
    chatMessages.length,
    wolfChatMessages.length,
    deadChatMessages.length,
    showMobileChat,
  ]);

  const alivePlayers = game.players.filter(
    (p) => p.status === PlayerStatus.ALIVE,
  );
  const deadPlayers = game.players.filter(
    (p) => p.status === PlayerStatus.DEAD,
  );

  // Who I vote for currently
  const myCurrentVote =
    game.votes.find((v) => v.voterId === playerId)?.targetId ?? null;

  // ── Submit night action ──────────────────────────────────
  const submitAction = () => {
    if (actionSubmitted) return;
    setActionSubmitted(true);
    if (
      phase === GamePhase.NIGHT_WOLF ||
      phase === GamePhase.NIGHT_SEER ||
      phase === GamePhase.NIGHT_DOCTOR ||
      phase === GamePhase.NIGHT_BODYGUARD ||
      phase === GamePhase.NIGHT_SERIAL_KILLER ||
      phase === GamePhase.NIGHT_WHITE_WOLF ||
      phase === GamePhase.NIGHT_ALPHA
    ) {
      onNightAction(phase, { targetId: selectedTarget });
    } else if (phase === GamePhase.NIGHT_FOX) {
      onNightAction(phase, { targetIds: selectedTargets });
    } else if (phase === GamePhase.NIGHT_WITCH) {
      onNightAction(phase, {
        usePotion: witchPotion,
        targetId: selectedTarget,
      });
    } else if (phase === GamePhase.NIGHT_CUPID) {
      onNightAction(phase, { targetIds: selectedTargets });
    } else if (phase === GamePhase.NIGHT_WILD_CHILD) {
      onNightAction(phase, { targetId: selectedTarget });
    }
  };

  // ── Send chat ────────────────────────────────────────────
  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    if (chatTab === "public") onSendChat(chatInput.trim());
    else if (chatTab === "wolf") onSendWolfChat(chatInput.trim());
    else onSendDeadChat(chatInput.trim());
    setChatInput("");
  };

  // ── Build vote tally ─────────────────────────────────────
  const voteCount = game.votes.reduce(
    (acc, v) => {
      acc[v.targetId] = (acc[v.targetId] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // ── My action role check ─────────────────────────────────
  const isMyNightPhase = (): boolean => {
    if (!me || !isAlive) return false;
    switch (phase) {
      case GamePhase.NIGHT_WOLF:
        return game.wolfChatEnabled;
      case GamePhase.NIGHT_SEER:
      case GamePhase.NIGHT_DOCTOR:
      case GamePhase.NIGHT_BODYGUARD:
      case GamePhase.NIGHT_SERIAL_KILLER:
      case GamePhase.NIGHT_MEDIUM:
        return me.role === phaseToRole(phase);
      case GamePhase.NIGHT_WHITE_WOLF:
        return me.role === RoleId.WHITE_WOLF;
      case GamePhase.NIGHT_ALPHA:
        return me.role === RoleId.ALPHA_WOLF;
      case GamePhase.NIGHT_WITCH:
        return me.role === RoleId.WITCH;
      case GamePhase.NIGHT_FOX:
        return me.role === RoleId.FOX && (me.foxActive ?? true);
      case GamePhase.NIGHT_CUPID:
        return me.role === RoleId.CUPID;
      case GamePhase.NIGHT_WILD_CHILD:
        return me.role === RoleId.WILD_CHILD;
      default:
        return false;
    }
  };

  return (
    <div
      className="h-dvh bg-cover bg-center text-white overflow-hidden"
      style={{ backgroundImage: `url('${bgPath}')` }}
    >
      <div className="h-full bg-black/70 flex flex-col">
        {/* ── Top bar ─────────────────────────────── */}
        <div
          className={`flex items-center justify-between px-4 py-2 border-b border-white/10 flex-shrink-0 ${isNight ? "bg-blue-950/60" : "bg-yellow-900/40"}`}
        >
          <div className="flex items-center gap-3">
            <Image
              src={
                isNight
                  ? "/assets/ma-soi/ui/moon.png"
                  : phase === GamePhase.DAY_VOTE ||
                      phase === GamePhase.DAY_VOTE_RESULT
                    ? "/assets/ma-soi/ui/vote.png"
                    : "/assets/ma-soi/ui/sun.png"
              }
              alt={isNight ? "Đêm" : "Ngày"}
              width={28}
              height={28}
              className="drop-shadow-lg flex-shrink-0"
            />
            <div>
              <div className="font-bold text-xs sm:text-sm leading-tight">
                {phaseInfo?.title ?? phase}
              </div>
              <div className="text-[10px] text-white/50 hidden sm:block">
                {phaseInfo?.subtitle}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1">
              <Image
                src="/assets/ma-soi/ui/timer.png"
                alt="Đồng hồ"
                width={16}
                height={16}
                className={
                  secondsLeft <= 10 ? "opacity-100 animate-pulse" : "opacity-60"
                }
              />
              <div
                className={`text-base font-bold tabular-nums ${secondsLeft <= 10 ? "text-red-400" : "text-white"}`}
              >
                {secondsLeft}s
              </div>
            </div>
            <div className="text-center hidden sm:block">
              <div className="text-xs font-semibold">Vòng {game.round}</div>
              <div className="text-[10px] text-white/40">
                {alivePlayers.length} sống
              </div>
            </div>
            <div className="text-[10px] text-white/40 sm:hidden">
              V{game.round} · {alivePlayers.length}↑
            </div>
            <button
              onClick={() => setShowLog(!showLog)}
              className="text-[10px] sm:text-xs bg-white/10 hover:bg-white/20 px-1.5 sm:px-2 py-1 rounded transition-all"
            >
              📋
            </button>
          </div>
        </div>

        {/* ── Log overlay ─────────────────────────── */}
        {showLog && (
          <div
            className="absolute top-12 right-2 z-40 w-72 bg-black/90 border border-white/20 rounded-xl p-3 max-h-64 overflow-y-auto text-xs shadow-xl"
            ref={logRef}
          >
            <div className="font-bold mb-2 text-white/70">Nhật ký ván đấu</div>
            {game.log.map((entry, i) => (
              <div key={i} className="text-white/70 leading-relaxed">
                {entry}
              </div>
            ))}
          </div>
        )}

        {/* ── My role card ─────────────────────────── */}
        {me && (
          <div
            className={`flex-shrink-0 px-3 py-2 flex flex-wrap items-center gap-2 ${isNight ? "bg-blue-900/30" : "bg-yellow-800/20"} border-b border-white/10`}
          >
            {me.role ? (
              <>
                <div className="relative">
                  <Image
                    src={ROLE_DEFS[me.role].image}
                    alt={ROLE_DEFS[me.role].name}
                    width={48}
                    height={48}
                    className="rounded-xl border border-white/20 shadow-lg"
                  />
                  {me.status === PlayerStatus.DEAD && (
                    <div className="absolute inset-0 rounded-xl bg-black/50 flex items-center justify-center">
                      <Image
                        src="/assets/ma-soi/ui/skull.png"
                        alt="Chết"
                        width={28}
                        height={28}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-xs text-white/50">
                    Vai trò của bạn —{" "}
                  </span>
                  <span className="font-bold text-sm">
                    {ROLE_DEFS[me.role].name}
                  </span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Image
                      src={
                        ROLE_DEFS[me.role].team === Team.VILLAGE
                          ? "/assets/ma-soi/ui/badge-village.png"
                          : ROLE_DEFS[me.role].team === Team.WEREWOLF
                            ? "/assets/ma-soi/ui/badge-wolf.png"
                            : "/assets/ma-soi/ui/badge-solo.png"
                      }
                      alt="phe"
                      width={14}
                      height={14}
                    />
                    <span className="text-[10px] text-white/40">
                      {ROLE_DEFS[me.role].team}
                    </span>
                    {me.status === PlayerStatus.DEAD && (
                      <span className="ml-1 text-red-400 text-xs">
                        — Đã chết
                      </span>
                    )}
                  </div>
                </div>
                {/* Wolf mates */}
                {game.myWolfMates && game.myWolfMates.length > 0 && (
                  <div className="ml-auto flex items-center gap-1 text-xs text-red-300">
                    <Image
                      src="/assets/ma-soi/ui/wolf-paw.png"
                      alt="sói"
                      width={14}
                      height={14}
                    />
                    {game.myWolfMates
                      .map((id) => game.players.find((p) => p.id === id)?.name)
                      .join(", ")}
                  </div>
                )}
                {/* Lovers */}
                {game.myLoversPartner && (
                  <div className="ml-auto flex items-center gap-1 text-xs text-pink-300">
                    <Image
                      src="/assets/ma-soi/ui/heart.png"
                      alt="tình nhân"
                      width={14}
                      height={14}
                    />
                    {
                      game.players.find((p) => p.id === game.myLoversPartner)
                        ?.name
                    }
                  </div>
                )}
              </>
            ) : (
              <span className="text-white/40 text-sm">Đang chờ chia bài…</span>
            )}

            {/* Seer history */}
            {me.role === RoleId.SEER && seerHistory.length > 0 && (
              <div className="ml-auto flex gap-1 flex-wrap justify-end max-w-xs items-center">
                <Image
                  src="/assets/ma-soi/ui/eye.png"
                  alt="seer"
                  width={14}
                  height={14}
                  className="opacity-60"
                />
                {seerHistory.map((h, i) => {
                  const name =
                    game.players.find((p) => p.id === h.targetId)?.name ??
                    h.targetId;
                  return (
                    <span
                      key={i}
                      className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded ${h.isWolf ? "bg-red-600/60" : "bg-green-700/60"}`}
                    >
                      {h.isWolf && (
                        <Image
                          src="/assets/ma-soi/ui/wolf-paw.png"
                          alt="sói"
                          width={10}
                          height={10}
                        />
                      )}
                      {name}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Main content ─────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">
          {/* ── Player grid (left) ──────────────── */}
          <div className="flex-1 overflow-y-auto p-3 pb-20 md:pb-3">
            {/* Alive players */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {game.players.map((player) => {
                const voteCountForPlayer = voteCount[player.id] ?? 0;
                const meVotedThis = myCurrentVote === player.id;
                const isSelectable = getPlayerSelectability(
                  player,
                  phase,
                  me,
                  selectedTargets,
                  game,
                );
                const isSelected =
                  selectedTarget === player.id ||
                  selectedTargets.includes(player.id);
                const isDead = player.status === PlayerStatus.DEAD;

                return (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    isMe={player.id === playerId}
                    isSelected={isSelected}
                    isSelectable={isSelectable && !actionSubmitted}
                    voteCount={voteCountForPlayer}
                    meVotedThis={meVotedThis}
                    isDead={isDead}
                    showVote={
                      phase === GamePhase.DAY_VOTE ||
                      phase === GamePhase.DAY_VOTE_RESULT
                    }
                    onClick={() => {
                      if (!isSelectable || actionSubmitted) return;

                      // Day vote
                      if (
                        phase === GamePhase.DAY_VOTE &&
                        isAlive &&
                        player.id !== playerId
                      ) {
                        if (meVotedThis) onUnvote();
                        else onVote(player.id);
                        return;
                      }

                      // Hunter shot
                      if (
                        phase === GamePhase.HUNTER_SHOT &&
                        me?.role === RoleId.HUNTER
                      ) {
                        onHunterShoot(player.id);
                        return;
                      }

                      // Night multi-select (Fox × 3, Cupid × 2)
                      if (
                        phase === GamePhase.NIGHT_FOX ||
                        phase === GamePhase.NIGHT_CUPID
                      ) {
                        const limit = phase === GamePhase.NIGHT_FOX ? 3 : 2;
                        setSelectedTargets((prev) => {
                          if (prev.includes(player.id))
                            return prev.filter((x) => x !== player.id);
                          if (prev.length >= limit) return prev;
                          return [...prev, player.id];
                        });
                      } else {
                        setSelectedTarget((prev) =>
                          prev === player.id ? null : player.id,
                        );
                      }
                    }}
                  />
                );
              })}
            </div>

            {/* ── Night action panel ─────────────── */}
            {isMyNightPhase() && !actionSubmitted && (
              <div
                className={`mt-4 bg-blue-950/70 border border-blue-500/30 rounded-xl p-3 space-y-3`}
              >
                <div className="flex items-center gap-2">
                  {me?.role && ROLE_DEFS[me.role] && (
                    <Image
                      src={ROLE_DEFS[me.role].image}
                      alt={ROLE_DEFS[me.role].name}
                      width={24}
                      height={24}
                      className="rounded-md opacity-80"
                    />
                  )}
                  <p className="text-xs uppercase tracking-widest text-blue-300">
                    {phaseInfo?.subtitle ?? "Chọn hành động"}
                  </p>
                </div>

                {/* Witch special */}
                {phase === GamePhase.NIGHT_WITCH && (
                  <div className="flex gap-2 flex-wrap">
                    {!me?.witchSaveUsed && (
                      <button
                        onClick={() =>
                          setWitchPotion(
                            witchPotion === "save" ? "none" : "save",
                          )
                        }
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${witchPotion === "save" ? "bg-green-600 ring-2 ring-green-300" : "bg-white/10 hover:bg-white/20"}`}
                      >
                        <Image
                          src="/assets/ma-soi/ui/potion-save.png"
                          alt="thuốc cứu"
                          width={18}
                          height={18}
                        />
                        Thuốc cứu{" "}
                        {game.nightDeaths.length > 0 &&
                          `(sẽ cứu ${game.players.find((p) => game.nightDeaths.includes(p.id))?.name ?? "…"})`}
                      </button>
                    )}
                    {!me?.witchKillUsed && (
                      <button
                        onClick={() =>
                          setWitchPotion(
                            witchPotion === "kill" ? "none" : "kill",
                          )
                        }
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${witchPotion === "kill" ? "bg-red-600 ring-2 ring-red-300" : "bg-white/10 hover:bg-white/20"}`}
                      >
                        <Image
                          src="/assets/ma-soi/ui/potion-kill.png"
                          alt="thuốc độc"
                          width={18}
                          height={18}
                        />
                        Thuốc độc{" "}
                        {witchPotion === "kill" && selectedTarget
                          ? `→ ${game.players.find((p) => p.id === selectedTarget)?.name}`
                          : "(chọn mục tiêu)"}
                      </button>
                    )}
                    <button
                      onClick={() => setWitchPotion("none")}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${witchPotion === "none" ? "bg-white/20" : "bg-white/10 hover:bg-white/20"}`}
                    >
                      Bỏ qua
                    </button>
                  </div>
                )}

                {/* Fox target count */}
                {phase === GamePhase.NIGHT_FOX && (
                  <p className="text-xs text-white/50">
                    Đã chọn {selectedTargets.length}/3 người
                  </p>
                )}
                {phase === GamePhase.NIGHT_CUPID && (
                  <p className="text-xs text-white/50">
                    Đã chọn {selectedTargets.length}/2 tình nhân
                  </p>
                )}

                {/* Submit */}
                <button
                  onClick={submitAction}
                  disabled={
                    !canSubmitAction(
                      phase,
                      selectedTarget,
                      selectedTargets,
                      witchPotion,
                    )
                  }
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 font-bold py-2 rounded-lg transition-all text-sm"
                >
                  ✓ Xác nhận
                </button>
              </div>
            )}

            {actionSubmitted && isNight && (
              <div className="mt-4 text-center text-white/50 text-sm py-3 bg-white/5 rounded-xl">
                ✅ Đã gửi hành động. Chờ những người khác…
              </div>
            )}

            {/* Day vote result */}
            {phase === GamePhase.DAY_VOTE_RESULT && game.dayEliminated && (
              <div className="mt-4 bg-red-900/50 border border-red-500/30 rounded-xl p-4 text-center">
                <Image
                  src="/assets/ma-soi/ui/skull.png"
                  alt="Bị loại"
                  width={40}
                  height={40}
                  className="mx-auto mb-2"
                />
                <div className="font-bold">
                  {game.players.find((p) => p.id === game.dayEliminated)
                    ?.name ?? "?"}{" "}
                  bị loại!
                </div>
                {game.players.find((p) => p.id === game.dayEliminated)
                  ?.role && (
                  <div className="flex items-center justify-center gap-2 mt-2">
                    {(() => {
                      const eliminated = game.players.find(
                        (p) => p.id === game.dayEliminated,
                      )!;
                      const rd = ROLE_DEFS[eliminated.role!];
                      return (
                        <>
                          <Image
                            src={rd.image}
                            alt={rd.name}
                            width={24}
                            height={24}
                            className="rounded"
                          />
                          <span className="text-sm text-white/60">
                            {rd.name}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
            {phase === GamePhase.DAY_VOTE_RESULT && !game.dayEliminated && (
              <div className="mt-4 bg-yellow-900/40 border border-yellow-500/30 rounded-xl p-4 text-center">
                <div className="font-bold">
                  ⚖️ Hòa phiếu — không ai bị loại hôm nay.
                </div>
              </div>
            )}

            {/* Hunter shot */}
            {phase === GamePhase.HUNTER_SHOT && me?.role === RoleId.HUNTER && (
              <div className="mt-4 bg-amber-900/60 border border-amber-500/30 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Image
                    src="/assets/ma-soi/ui/arrow.png"
                    alt="Bắn"
                    width={24}
                    height={24}
                  />
                  <p className="font-bold text-amber-300">
                    Bạn là Thợ Săn! Hãy bắn 1 người trước khi ngã.
                  </p>
                </div>
                <p className="text-sm text-white/50">
                  Nhấn vào người bạn muốn bắn ở trên.
                </p>
              </div>
            )}

            {/* Night deaths reveal */}
            {phase === GamePhase.DAY_REVEAL && game.nightDeaths.length > 0 && (
              <div className="mt-4 bg-gray-900/70 border border-white/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Image
                    src="/assets/ma-soi/ui/skull.png"
                    alt="Chết"
                    width={20}
                    height={20}
                  />
                  <p className="text-sm font-bold">Đêm qua có người đã chết:</p>
                </div>
                <div className="space-y-2">
                  {game.nightDeaths.map((id) => {
                    const p = game.players.find((x) => x.id === id);
                    return p ? (
                      <div
                        key={id}
                        className="flex items-center gap-3 bg-red-900/30 rounded-lg p-2"
                      >
                        <Image
                          src={
                            p.avatar || "/assets/ma-soi/ui/avatars/avatar-1.png"
                          }
                          alt={p.name}
                          width={32}
                          height={32}
                          className="rounded-full border border-red-500/50"
                        />
                        <span className="font-semibold text-sm text-red-300">
                          {p.name}
                        </span>
                        {p.role && (
                          <div className="ml-auto flex items-center gap-1.5">
                            <Image
                              src={ROLE_DEFS[p.role].image}
                              alt={ROLE_DEFS[p.role].name}
                              width={20}
                              height={20}
                              className="rounded"
                            />
                            <span className="text-xs text-white/40">
                              {ROLE_DEFS[p.role].name}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}
            {phase === GamePhase.DAY_REVEAL &&
              game.nightDeaths.length === 0 && (
                <div className="mt-4 bg-green-900/40 border border-green-500/30 rounded-xl p-4 text-center text-sm">
                  🌄 Đêm bình yên — không có ai chết!
                </div>
              )}
          </div>

          {/* ── Right panel: Chat ──────────────── */}
          <div className="w-64 flex-shrink-0 border-l border-white/10 flex flex-col hidden md:flex">
            {/* Chat tabs */}
            <div className="flex flex-shrink-0 border-b border-white/10">
              <ChatTab
                icon="/assets/ma-soi/ui/chat-bubble.png"
                label="Công khai"
                active={chatTab === "public"}
                onClick={() => setChatTab("public")}
              />
              {game.wolfChatEnabled && (
                <ChatTab
                  icon="/assets/ma-soi/ui/wolf-paw.png"
                  label="Sói"
                  active={chatTab === "wolf"}
                  onClick={() => setChatTab("wolf")}
                />
              )}
              {me?.status === PlayerStatus.DEAD && (
                <ChatTab
                  icon="/assets/ma-soi/ui/ghost.png"
                  label="Ma"
                  active={chatTab === "dead"}
                  onClick={() => setChatTab("dead")}
                />
              )}
            </div>

            {/* Messages */}
            <ChatMessageList
              messages={
                chatTab === "public"
                  ? chatMessages
                  : chatTab === "wolf"
                    ? wolfChatMessages
                    : deadChatMessages
              }
            />

            {/* Input */}
            {(chatTab === "public" &&
              isAlive &&
              phase === GamePhase.DAY_DISCUSSION) ||
            (chatTab === "wolf" && game.wolfChatEnabled && isNight) ||
            (chatTab === "dead" && me?.status === PlayerStatus.DEAD) ? (
              <div className="flex gap-1 p-2 border-t border-white/10 flex-shrink-0">
                <input
                  className="flex-1 bg-white/10 rounded-lg px-2 py-1 text-xs text-white placeholder-white/30 focus:outline-none min-w-0"
                  placeholder="Nhắn tin…"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                  maxLength={200}
                />
                <button
                  onClick={handleSendChat}
                  className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-all"
                >
                  ↵
                </button>
              </div>
            ) : (
              <div className="p-2 text-center text-xs text-white/20 flex-shrink-0">
                {phase !== GamePhase.DAY_DISCUSSION
                  ? "Chat khi thảo luận"
                  : "Bạn không thể chat lúc này"}
              </div>
            )}
          </div>
        </div>

        {/* ── Mobile Chat FAB ──────────────────────── */}
        <button
          onClick={() => {
            setShowMobileChat(true);
            setMobileUnread(0);
          }}
          style={{ bottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))" }}
          className="md:hidden fixed right-4 z-40 w-14 h-14 bg-purple-600 hover:bg-purple-500 active:scale-95 rounded-full flex items-center justify-center shadow-2xl ring-2 ring-purple-400/30 transition-all"
        >
          <Image
            src="/assets/ma-soi/ui/chat-bubble.png"
            alt="Chat"
            width={28}
            height={28}
          />
          {mobileUnread > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {mobileUnread > 9 ? "9+" : mobileUnread}
            </span>
          )}
        </button>

        {/* ── Mobile Chat Sheet ────────────────────── */}
        {showMobileChat && (
          <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setShowMobileChat(false)}
            />
            {/* Sheet card */}
            <div
              className="relative bg-gray-950 border-t border-white/20 rounded-t-2xl flex flex-col shadow-2xl"
              style={{ height: "65vh" }}
            >
              {/* Header + tabs */}
              <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-white/10 flex-shrink-0">
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    {
                      tab: "public" as const,
                      icon: "/assets/ma-soi/ui/chat-bubble.png",
                      label: "Công khai",
                      show: true,
                    },
                    {
                      tab: "wolf" as const,
                      icon: "/assets/ma-soi/ui/wolf-paw.png",
                      label: "Sói",
                      show: game.wolfChatEnabled,
                    },
                    {
                      tab: "dead" as const,
                      icon: "/assets/ma-soi/ui/ghost.png",
                      label: "Ma",
                      show: me?.status === PlayerStatus.DEAD,
                    },
                  ]
                    .filter((t) => t.show)
                    .map(({ tab, icon, label }) => (
                      <button
                        key={tab}
                        onClick={() => setChatTab(tab)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          chatTab === tab
                            ? "bg-purple-600 text-white"
                            : "bg-white/10 text-white/60"
                        }`}
                      >
                        <Image src={icon} alt={label} width={14} height={14} />
                        {label}
                      </button>
                    ))}
                </div>
                <button
                  onClick={() => setShowMobileChat(false)}
                  className="text-white/50 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all flex-shrink-0"
                >
                  ✕
                </button>
              </div>

              {/* Messages */}
              <ChatMessageList
                messages={
                  chatTab === "public"
                    ? chatMessages
                    : chatTab === "wolf"
                      ? wolfChatMessages
                      : deadChatMessages
                }
              />

              {/* Input */}
              {(chatTab === "public" &&
                isAlive &&
                phase === GamePhase.DAY_DISCUSSION) ||
              (chatTab === "wolf" && game.wolfChatEnabled && isNight) ||
              (chatTab === "dead" && me?.status === PlayerStatus.DEAD) ? (
                <div
                  className="flex gap-2 p-3 border-t border-white/10 flex-shrink-0"
                  style={{
                    paddingBottom:
                      "max(0.75rem, env(safe-area-inset-bottom, 0.75rem))",
                  }}
                >
                  <input
                    className="flex-1 bg-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-purple-500 min-w-0"
                    placeholder="Nhắn tin…"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                    maxLength={200}
                    autoFocus
                  />
                  <button
                    onClick={handleSendChat}
                    className="bg-purple-600 hover:bg-purple-500 active:scale-95 px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex-shrink-0"
                  >
                    ↵
                  </button>
                </div>
              ) : (
                <div className="p-3 text-center text-xs text-white/20 flex-shrink-0">
                  {phase !== GamePhase.DAY_DISCUSSION
                    ? "Chat khi thảo luận"
                    : "Bạn không thể chat lúc này"}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────

function PlayerCard({
  player,
  isMe,
  isSelected,
  isSelectable,
  voteCount,
  meVotedThis,
  isDead,
  showVote,
  onClick,
}: {
  player: ClientMaSoiPlayer;
  isMe: boolean;
  isSelected: boolean;
  isSelectable: boolean;
  voteCount: number;
  meVotedThis: boolean;
  isDead: boolean;
  showVote: boolean;
  onClick: () => void;
}) {
  const roleDef = player.role ? ROLE_DEFS[player.role] : null;

  return (
    <button
      onClick={onClick}
      disabled={!isSelectable}
      className={`
                relative rounded-xl p-2 flex flex-col items-center gap-1 text-center transition-all border select-none
                ${isDead ? "opacity-40 grayscale" : ""}
                ${isSelected ? "border-yellow-400 bg-yellow-500/20 scale-105" : isSelectable ? "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10 cursor-pointer" : "border-white/10 bg-white/5 cursor-default"}
                ${isMe ? "ring-2 ring-yellow-400/50" : ""}
            `}
    >
      {/* Avatar */}
      <div className="relative">
        <Image
          src={player.avatar || "/assets/ma-soi/ui/avatars/avatar-1.png"}
          alt={player.name}
          width={44}
          height={44}
          className="rounded-full"
        />
        {isDead && (
          <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
            <Image
              src="/assets/ma-soi/ui/skull.png"
              alt="Chết"
              width={22}
              height={22}
            />
          </div>
        )}
        {player.isHost && (
          <div className="absolute -top-1.5 -right-1.5">
            <Image
              src="/assets/ma-soi/ui/crown.png"
              alt="Host"
              width={16}
              height={16}
            />
          </div>
        )}
      </div>

      {/* Name */}
      <span className="text-[10px] font-semibold truncate w-full leading-tight">
        {player.name}
      </span>

      {/* Role (if known) */}
      {roleDef ? (
        <div className="flex items-center gap-0.5">
          <Image
            src={roleDef.image}
            alt={roleDef.name}
            width={14}
            height={14}
            className="rounded"
          />
          <span className="text-[9px] text-white/50">{roleDef.name}</span>
        </div>
      ) : (
        <div className="w-4 h-4">
          <Image
            src="/assets/ma-soi/ui/question.png"
            alt="Ẩn"
            width={14}
            height={14}
            className="opacity-30"
          />
        </div>
      )}

      {/* Vote count badge */}
      {showVote && voteCount > 0 && (
        <div
          className={`absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${meVotedThis ? "bg-red-500" : "bg-orange-500"}`}
        >
          {voteCount}
        </div>
      )}

      {/* My vote indicator */}
      {meVotedThis && showVote && (
        <div className="absolute top-0 right-0">
          <Image
            src="/assets/ma-soi/ui/vote.png"
            alt="Phiếu"
            width={14}
            height={14}
          />
        </div>
      )}
    </button>
  );
}

function ChatTab({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 flex flex-col items-center gap-0.5 transition-all ${active ? "text-white border-b-2 border-yellow-400" : "text-white/40 hover:text-white"}`}
    >
      <Image
        src={icon}
        alt={label}
        width={16}
        height={16}
        className={active ? "opacity-100" : "opacity-50"}
      />
      <span className="text-[9px]">{label}</span>
    </button>
  );
}

function ChatMessageList({ messages }: { messages: ChatMessage[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [messages]);

  return (
    <div ref={ref} className="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-0">
      {messages.length === 0 && (
        <p className="text-center text-white/20 text-xs mt-4">
          Chưa có tin nhắn…
        </p>
      )}
      {messages.map((msg, i) => (
        <div key={i} className="text-xs">
          <span className="font-semibold text-white/80">{msg.name}: </span>
          <span className="text-white/60">{msg.message}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function phaseToRole(phase: GamePhase): RoleId | null {
  switch (phase) {
    case GamePhase.NIGHT_SEER:
      return RoleId.SEER;
    case GamePhase.NIGHT_DOCTOR:
      return RoleId.DOCTOR;
    case GamePhase.NIGHT_BODYGUARD:
      return RoleId.BODYGUARD;
    case GamePhase.NIGHT_SERIAL_KILLER:
      return RoleId.SERIAL_KILLER;
    case GamePhase.NIGHT_MEDIUM:
      return RoleId.MEDIUM;
    default:
      return null;
  }
}

function canSubmitAction(
  phase: GamePhase,
  target: string | null,
  targets: string[],
  potion: "save" | "kill" | "none",
): boolean {
  if (
    phase === GamePhase.NIGHT_WOLF ||
    phase === GamePhase.NIGHT_SEER ||
    phase === GamePhase.NIGHT_DOCTOR ||
    phase === GamePhase.NIGHT_BODYGUARD ||
    phase === GamePhase.NIGHT_SERIAL_KILLER ||
    phase === GamePhase.NIGHT_WILD_CHILD
  )
    return !!target;
  if (phase === GamePhase.NIGHT_ALPHA || phase === GamePhase.NIGHT_WHITE_WOLF)
    return true; // can skip
  if (phase === GamePhase.NIGHT_FOX) return targets.length === 3;
  if (phase === GamePhase.NIGHT_CUPID) return targets.length === 2;
  if (phase === GamePhase.NIGHT_WITCH)
    return (
      potion === "none" || potion === "save" || (potion === "kill" && !!target)
    );
  return true;
}

function getPlayerSelectability(
  player: ClientMaSoiPlayer,
  phase: GamePhase,
  me: ClientMaSoiPlayer | null,
  selectedTargets: string[],
  game: ClientMaSoiGameState,
): boolean {
  if (!me) return false;
  const isAlive = player.status === PlayerStatus.ALIVE;

  // Day vote
  if (phase === GamePhase.DAY_VOTE) {
    return isAlive && player.id !== me.id && me.status === PlayerStatus.ALIVE;
  }

  // Hunter shot
  if (phase === GamePhase.HUNTER_SHOT) {
    return isAlive && player.id !== me.id && me.role === RoleId.HUNTER;
  }

  // Night — dead player = not selectable
  if (!isAlive) return false;

  switch (phase) {
    case GamePhase.NIGHT_WOLF:
      return player.id !== me.id && game.wolfChatEnabled;
    case GamePhase.NIGHT_SEER:
      return player.id !== me.id && me.role === RoleId.SEER;
    case GamePhase.NIGHT_DOCTOR:
      return me.role === RoleId.DOCTOR;
    case GamePhase.NIGHT_BODYGUARD:
      return player.id !== me.id && me.role === RoleId.BODYGUARD;
    case GamePhase.NIGHT_SERIAL_KILLER:
      return player.id !== me.id && me.role === RoleId.SERIAL_KILLER;
    case GamePhase.NIGHT_WITCH:
      return me.role === RoleId.WITCH;
    case GamePhase.NIGHT_FOX:
      return (
        me.role === RoleId.FOX &&
        (me.foxActive ?? true) &&
        (selectedTargets.length < 3 || selectedTargets.includes(player.id))
      );
    case GamePhase.NIGHT_CUPID:
      return (
        player.id !== me.id &&
        me.role === RoleId.CUPID &&
        (selectedTargets.length < 2 || selectedTargets.includes(player.id))
      );
    case GamePhase.NIGHT_WILD_CHILD:
      return player.id !== me.id && me.role === RoleId.WILD_CHILD;
    case GamePhase.NIGHT_ALPHA:
      return me.role === RoleId.ALPHA_WOLF && player.id !== me.id;
    case GamePhase.NIGHT_WHITE_WOLF:
      return (
        me.role === RoleId.WHITE_WOLF &&
        player.id !== me.id &&
        player.team === Team.WEREWOLF
      );
    default:
      return false;
  }
}
