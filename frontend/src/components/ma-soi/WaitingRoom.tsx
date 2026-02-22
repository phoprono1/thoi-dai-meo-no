"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ClientMaSoiRoom,
  ClientMaSoiPlayer,
  GameConfig,
  ROLE_DEFS,
  RoleId,
  Team,
  GAME_PRESETS,
  recommendRoleCounts,
} from "@/lib/maSoiData";

interface WaitingRoomProps {
  room: ClientMaSoiRoom;
  playerId: string | null;
  error: string | null;
  onLeave: () => void;
  onKick: (targetId: string) => void;
  onUpdateConfig: (patch: Partial<GameConfig>) => void;
  onStartGame: () => void;
}

export default function WaitingRoom({
  room,
  playerId,
  error,
  onLeave,
  onKick,
  onUpdateConfig,
  onStartGame,
}: WaitingRoomProps) {
  const [activeTab, setActiveTab] = useState<"players" | "roles" | "settings">(
    "players",
  );
  const isHost = room.players.find((p) => p.id === playerId)?.isHost ?? false;
  const playerCount = room.players.length;

  // Derive total assigned roles
  const totalRoles = Object.values(room.config.roleCounts).reduce(
    (s, v) => s + (v ?? 0),
    0,
  );
  const canStart = isHost && playerCount >= 5 && totalRoles === playerCount;

  // ── Helper: apply preset ─────────────────────────────────
  const applyPreset = (presetId: string) => {
    const preset = GAME_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const suggested = recommendRoleCounts(playerCount);
    onUpdateConfig({ ...preset.config, roleCounts: suggested });
  };

  // ── Helper: change role count ─────────────────────────────
  const setRoleCount = (roleId: RoleId, delta: number) => {
    const current = room.config.roleCounts[roleId] ?? 0;
    const next = Math.max(0, current + delta);
    onUpdateConfig({
      roleCounts: { ...room.config.roleCounts, [roleId]: next },
    });
  };

  // Role tiers
  const TIER_ORDER = ["basic", "standard", "advanced"] as const;
  const TEAM_ORDER = [
    Team.VILLAGE,
    Team.WEREWOLF,
    Team.JESTER,
    Team.SERIAL_KILLER,
  ] as const;

  return (
    <div
      className="min-h-screen bg-cover bg-center text-white"
      style={{ backgroundImage: "url('/assets/ma-soi/backgrounds/lobby.jpg')" }}
    >
      <div className="min-h-dvh md:h-dvh bg-black/75 flex flex-col md:flex-row">
        {/* ── Left panel: player list ────────────────── */}
        <div className="w-full md:w-72 flex-shrink-0 border-b md:border-b-0 md:border-r border-white/10 p-4 flex flex-col">
          {/* Room info */}
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <Image
                src="/assets/ma-soi/ui/moon.png"
                alt="phòng"
                width={20}
                height={20}
                className="opacity-70"
              />
              <span className="text-lg font-bold truncate">{room.name}</span>
              {room.hasPassword && (
                <span className="text-xs text-yellow-400">🔒</span>
              )}
            </div>
            <div className="text-sm text-white/50 mt-0.5">
              {playerCount}/{room.maxPlayers} người chơi
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-600/80 rounded-lg px-3 py-2 text-sm mb-3">
              ⚠️ {error}
            </div>
          )}

          {/* Player list */}
          <div className="md:flex-1 md:overflow-y-auto space-y-2">
            {room.players.map((player) => (
              <PlayerRow
                key={player.id}
                player={player}
                isMe={player.id === playerId}
                isHost={isHost}
                onKick={() => onKick(player.id)}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="mt-4 space-y-2">
            {canStart && (
              <button
                onClick={onStartGame}
                className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-2.5 rounded-xl transition-all shadow-lg"
              >
                ▶ Bắt đầu trận ({totalRoles} vai trò)
              </button>
            )}
            {isHost && !canStart && (
              <div className="text-center text-xs text-white/40 py-1">
                {playerCount < 5
                  ? `Cần ít nhất 5 người (${playerCount}/5)`
                  : totalRoles !== playerCount
                    ? `Tổng vai trò ${totalRoles} ≠ ${playerCount} người`
                    : ""}
              </div>
            )}
            <button
              onClick={onLeave}
              className="w-full bg-white/10 hover:bg-white/20 py-2 rounded-xl transition-all text-sm text-white/70"
            >
              ← Rời phòng
            </button>
          </div>
        </div>

        {/* ── Right panel: config tabs ───────────────── */}
        <div className="flex-1 flex flex-col md:overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-white/10 flex-shrink-0">
            {(["players", "roles", "settings"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 flex flex-col items-center gap-0.5 text-xs font-semibold transition-all ${
                  activeTab === tab
                    ? "text-yellow-400 border-b-2 border-yellow-400"
                    : "text-white/50 hover:text-white"
                }`}
              >
                <Image
                  src={
                    tab === "players"
                      ? "/assets/ma-soi/ui/badge-village.png"
                      : tab === "roles"
                        ? "/assets/ma-soi/ui/question.png"
                        : "/assets/ma-soi/ui/shield.png"
                  }
                  alt={tab}
                  width={16}
                  height={16}
                  className={activeTab === tab ? "opacity-100" : "opacity-40"}
                />
                {tab === "players"
                  ? "Người chơi"
                  : tab === "roles"
                    ? "Vai trò"
                    : "Cài đặt"}
              </button>
            ))}
          </div>

          <div className="flex-1 md:overflow-y-auto p-4">
            {/* ── Players tab ── */}
            {activeTab === "players" && (
              <div className="space-y-3">
                <p className="text-white/50 text-sm">
                  {isHost
                    ? "Bạn là host. Có thể kick người chơi hoặc bắt đầu khi đủ điều kiện."
                    : "Chờ host bắt đầu trận…"}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {room.players.map((player) => (
                    <PlayerCard
                      key={player.id}
                      player={player}
                      isMe={player.id === playerId}
                    />
                  ))}
                  {Array.from({
                    length: Math.max(0, room.maxPlayers - playerCount),
                  }).map((_, i) => (
                    <EmptySlot key={i} />
                  ))}
                </div>
              </div>
            )}

            {/* ── Roles tab ── */}
            {activeTab === "roles" && (
              <div className="space-y-4">
                {/* Presets */}
                {isHost && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-white/40 mb-2">
                      Bộ cài đặt nhanh
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {GAME_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => applyPreset(preset.id)}
                          title={preset.description}
                          className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-1.5 text-sm transition-all"
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Role counts by team  */}
                {TEAM_ORDER.map((team) => {
                  const roles = Object.values(ROLE_DEFS).filter(
                    (r) =>
                      r.team === team &&
                      room.config.enabledRoles.includes(r.id),
                  );
                  if (roles.length === 0) return null;

                  const teamLabel =
                    team === Team.VILLAGE
                      ? {
                          icon: "/assets/ma-soi/ui/badge-village.png",
                          text: "Phe Dân Làng",
                        }
                      : team === Team.WEREWOLF
                        ? {
                            icon: "/assets/ma-soi/ui/badge-wolf.png",
                            text: "Phe Ma Sói",
                          }
                        : team === Team.JESTER
                          ? {
                              icon: "/assets/ma-soi/ui/badge-solo.png",
                              text: "Độc Lập",
                            }
                          : {
                              icon: "/assets/ma-soi/ui/badge-solo.png",
                              text: "Sát Nhân",
                            };
                  return (
                    <div key={team}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Image
                          src={teamLabel.icon}
                          alt={teamLabel.text}
                          width={14}
                          height={14}
                        />
                        <p className="text-xs uppercase tracking-widest text-white/40">
                          {teamLabel.text}
                        </p>
                      </div>
                      <div className="space-y-1">
                        {roles.map((roleDef) => (
                          <RoleRow
                            key={roleDef.id}
                            roleDef={roleDef}
                            count={room.config.roleCounts[roleDef.id] ?? 0}
                            isHost={isHost && roleDef.isToggleable}
                            onIncrease={() => setRoleCount(roleDef.id, 1)}
                            onDecrease={() => setRoleCount(roleDef.id, -1)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Roles not yet enabled */}
                {isHost && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-white/40 mb-2">
                      Vai trò chưa bật
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {Object.values(ROLE_DEFS)
                        .filter(
                          (r) =>
                            r.isToggleable &&
                            !room.config.enabledRoles.includes(r.id),
                        )
                        .map((r) => (
                          <button
                            key={r.id}
                            onClick={() =>
                              onUpdateConfig({
                                enabledRoles: [
                                  ...room.config.enabledRoles,
                                  r.id,
                                ],
                                roleCounts: {
                                  ...room.config.roleCounts,
                                  [r.id]: 1,
                                },
                              })
                            }
                            title={`${r.description}\nTối thiểu: ${r.minPlayers} người`}
                            className="flex items-center gap-1 bg-white/5 hover:bg-white/15 border border-white/20 rounded-lg px-2 py-1 text-xs transition-all"
                          >
                            <Image
                              src={r.image}
                              alt={r.name}
                              width={20}
                              height={20}
                              className="rounded"
                            />
                            + {r.name}
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Role count summary */}
                <div
                  className={`mt-2 text-center text-sm font-semibold ${totalRoles === playerCount ? "text-green-400" : "text-red-400"}`}
                >
                  Tổng vai trò: {totalRoles} / {playerCount} người chơi
                </div>
              </div>
            )}

            {/* ── Settings tab ── */}
            {activeTab === "settings" && (
              <div className="space-y-4 max-w-sm">
                <SettingRow label="Tốc độ game">
                  {isHost ? (
                    <select
                      value={room.config.speed}
                      onChange={(e) =>
                        onUpdateConfig({
                          speed: e.target.value as "normal" | "fast" | "slow",
                        })
                      }
                      className="bg-white/10 border border-white/30 rounded-lg px-2 py-1 text-sm text-white"
                    >
                      <option value="slow" className="bg-gray-800">
                        Chậm
                      </option>
                      <option value="normal" className="bg-gray-800">
                        Bình thường
                      </option>
                      <option value="fast" className="bg-gray-800">
                        Nhanh
                      </option>
                    </select>
                  ) : (
                    <span className="text-white/70 text-sm">
                      {room.config.speed === "fast"
                        ? "Nhanh"
                        : room.config.speed === "slow"
                          ? "Chậm"
                          : "Bình thường"}
                    </span>
                  )}
                </SettingRow>

                <SettingRow label="Lộ vai trò khi chết">
                  <ToggleSwitch
                    value={room.config.revealRoleOnDeath}
                    disabled={!isHost}
                    onChange={(v) => onUpdateConfig({ revealRoleOnDeath: v })}
                  />
                </SettingRow>

                <SettingRow label="Thầy thuốc tự cứu mình">
                  <ToggleSwitch
                    value={room.config.doctorCanSaveSelf}
                    disabled={!isHost}
                    onChange={(v) => onUpdateConfig({ doctorCanSaveSelf: v })}
                  />
                </SettingRow>

                <SettingRow label="Cho phép quan sát viên">
                  <ToggleSwitch
                    value={room.config.allowSpectators}
                    disabled={!isHost}
                    onChange={(v) => onUpdateConfig({ allowSpectators: v })}
                  />
                </SettingRow>

                {isHost && (
                  <>
                    <SettingRow
                      label={`Thời gian đêm (${room.config.nightActionTime}s)`}
                    >
                      <input
                        type="range"
                        min={15}
                        max={60}
                        step={5}
                        value={room.config.nightActionTime}
                        onChange={(e) =>
                          onUpdateConfig({
                            nightActionTime: Number(e.target.value),
                          })
                        }
                        className="w-24"
                      />
                    </SettingRow>
                    <SettingRow
                      label={`Thảo luận (${room.config.discussionTime}s)`}
                    >
                      <input
                        type="range"
                        min={30}
                        max={300}
                        step={15}
                        value={room.config.discussionTime}
                        onChange={(e) =>
                          onUpdateConfig({
                            discussionTime: Number(e.target.value),
                          })
                        }
                        className="w-24"
                      />
                    </SettingRow>
                    <SettingRow label={`Bỏ phiếu (${room.config.voteTime}s)`}>
                      <input
                        type="range"
                        min={20}
                        max={120}
                        step={10}
                        value={room.config.voteTime}
                        onChange={(e) =>
                          onUpdateConfig({ voteTime: Number(e.target.value) })
                        }
                        className="w-24"
                      />
                    </SettingRow>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────

function PlayerRow({
  player,
  isMe,
  isHost,
  onKick,
}: {
  player: ClientMaSoiPlayer;
  isMe: boolean;
  isHost: boolean;
  onKick: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${isMe ? "bg-yellow-500/20 border border-yellow-500/30" : "bg-white/5"}`}
    >
      <Image
        src={player.avatar || "/assets/ma-soi/ui/avatars/avatar-1.png"}
        alt={player.name}
        width={28}
        height={28}
        className="rounded-full flex-shrink-0"
      />
      <span className="flex-1 text-sm truncate font-medium">
        {player.name}
        {isMe ? " (bạn)" : ""}
      </span>
      {player.isHost && (
        <Image
          src="/assets/ma-soi/ui/crown.png"
          alt="Host"
          width={16}
          height={16}
          className="flex-shrink-0"
        />
      )}
      {isHost && !isMe && !player.isHost && (
        <button
          onClick={onKick}
          className="text-red-400 hover:text-red-300 text-xs px-1 transition-colors"
        >
          kick
        </button>
      )}
    </div>
  );
}

function PlayerCard({
  player,
  isMe,
}: {
  player: ClientMaSoiPlayer;
  isMe: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-2 flex flex-col items-center gap-1 text-center ${isMe ? "bg-yellow-500/20 border border-yellow-500/30" : "bg-white/5 border border-white/10"}`}
    >
      <div className="relative">
        <Image
          src={player.avatar || "/assets/ma-soi/ui/avatars/avatar-1.png"}
          alt={player.name}
          width={52}
          height={52}
          className="rounded-full"
        />
        {player.isHost && (
          <div className="absolute -top-1.5 -right-1.5">
            <Image
              src="/assets/ma-soi/ui/crown.png"
              alt="Host"
              width={18}
              height={18}
            />
          </div>
        )}
      </div>
      <span className="text-xs font-medium truncate w-full">{player.name}</span>
      {player.isHost && (
        <span className="text-yellow-400 text-[10px]">Host</span>
      )}
    </div>
  );
}

function EmptySlot() {
  return (
    <div className="rounded-xl p-2 flex flex-col items-center gap-1 border border-white/5 border-dashed opacity-30">
      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-xl">
        ?
      </div>
      <span className="text-xs text-white/30">Chờ…</span>
    </div>
  );
}

function RoleRow({
  roleDef,
  count,
  isHost,
  onIncrease,
  onDecrease,
}: {
  roleDef: {
    id: RoleId;
    name: string;
    emoji: string;
    image: string;
    ability: string;
    isUnique: boolean;
  };
  count: number;
  isHost: boolean;
  onIncrease: () => void;
  onDecrease: () => void;
}) {
  return (
    <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
      <Image
        src={roleDef.image}
        alt={roleDef.name}
        width={28}
        height={28}
        className="rounded flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium">{roleDef.name}</span>
        <p className="text-xs text-white/40 truncate">{roleDef.ability}</p>
      </div>
      {isHost ? (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onDecrease}
            disabled={count === 0}
            className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 disabled:opacity-30 text-sm transition-all"
          >
            −
          </button>
          <span className="w-5 text-center font-bold text-sm">{count}</span>
          <button
            onClick={onIncrease}
            disabled={roleDef.isUnique && count >= 1}
            className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 disabled:opacity-30 text-sm transition-all"
          >
            +
          </button>
        </div>
      ) : (
        <span className="font-bold text-sm text-white/70 flex-shrink-0 w-6 text-center">
          {count}
        </span>
      )}
    </div>
  );
}

function SettingRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-white/70">{label}</span>
      {children}
    </div>
  );
}

function ToggleSwitch({
  value,
  disabled,
  onChange,
}: {
  value: boolean;
  disabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-all ${value ? "bg-green-500" : "bg-white/20"} ${disabled ? "opacity-50 cursor-default" : "cursor-pointer"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${value ? "translate-x-5" : ""}`}
      />
    </button>
  );
}
