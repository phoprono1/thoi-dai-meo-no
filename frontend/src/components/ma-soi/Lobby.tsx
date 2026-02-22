"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ClientMaSoiRoom, DEFAULT_AVATARS } from "@/lib/maSoiData";

interface LobbyProps {
  roomList: ClientMaSoiRoom[];
  playerName: string;
  playerAvatar: string;
  error: string | null;
  onSetName: (name: string) => void;
  onSetAvatar: (avatar: string) => void;
  onCreateRoom: (
    roomName: string,
    password?: string,
    maxPlayers?: number,
  ) => void;
  onJoinRoom: (roomId: string, password?: string) => void;
  onFetchRooms: () => void;
}

export default function Lobby({
  roomList,
  playerName,
  playerAvatar,
  error,
  onSetName,
  onSetAvatar,
  onCreateRoom,
  onJoinRoom,
  onFetchRooms,
}: LobbyProps) {
  const [name, setName] = useState(playerName);
  const [showCreate, setShowCreate] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [joinPasswordId, setJoinPasswordId] = useState<string | null>(null);
  const [joinPassword, setJoinPassword] = useState("");

  // Fetch room list on mount and every 5s
  useEffect(() => {
    onFetchRooms();
    const interval = setInterval(onFetchRooms, 5000);
    return () => clearInterval(interval);
  }, [onFetchRooms]);

  const handleCreate = () => {
    if (!name.trim()) return;
    onSetName(name.trim());
    onCreateRoom(
      roomName.trim() || `Phòng của ${name.trim()}`,
      roomPassword || undefined,
      maxPlayers,
    );
    setShowCreate(false);
  };

  const handleJoinClick = (room: ClientMaSoiRoom) => {
    if (!name.trim()) return;
    onSetName(name.trim());
    if (room.hasPassword) {
      setJoinPasswordId(room.id);
    } else {
      onJoinRoom(room.id);
    }
  };

  const handleJoinWithPassword = () => {
    if (!joinPasswordId) return;
    onJoinRoom(joinPasswordId, joinPassword);
    setJoinPasswordId(null);
    setJoinPassword("");
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center text-white"
      style={{ backgroundImage: "url('/assets/ma-soi/backgrounds/lobby.jpg')" }}
    >
      {/* Dark overlay */}
      <div className="min-h-screen bg-black/70 flex flex-col">
        {/* Header */}
        <div className="flex flex-col items-center pt-8 pb-4 select-none">
          <div className="flex items-center gap-3 mb-3">
            <Image
              src="/assets/ma-soi/ui/wolf-paw.png"
              alt="sói"
              width={48}
              height={48}
              className="drop-shadow-lg opacity-90"
            />
            <Image
              src="/assets/ma-soi/ui/moon.png"
              alt="trăng"
              width={56}
              height={56}
              className="drop-shadow-lg"
            />
            <Image
              src="/assets/ma-soi/ui/wolf-paw.png"
              alt="sói"
              width={48}
              height={48}
              className="drop-shadow-lg opacity-90 scale-x-[-1]"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-wide drop-shadow-lg">
            Ma Sói
          </h1>
          <p className="text-white/60 mt-1 text-sm">
            Trò chơi suy luận xã hội • 5–20 người
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-auto w-full max-w-lg px-4">
            <div className="bg-red-600/80 rounded-lg px-4 py-2 text-center text-sm font-semibold mb-3">
              ⚠️ {error}
            </div>
          </div>
        )}

        {/* Player Setup */}
        <div className="mx-auto w-full max-w-lg px-4 mb-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <p className="text-xs uppercase tracking-widest text-white/50 mb-3">
              Tên & Avatar của bạn
            </p>
            <div className="flex flex-col sm:flex-row gap-3 items-start">
              {/* Avatar picker */}
              <div className="grid grid-cols-4 gap-1 sm:gap-1.5 flex-shrink-0">
                {DEFAULT_AVATARS.map((src) => (
                  <button
                    key={src}
                    onClick={() => onSetAvatar(src)}
                    className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 transition-all hover:scale-105 ${
                      playerAvatar === src
                        ? "border-yellow-400 scale-110 ring-2 ring-yellow-400/40"
                        : "border-white/20 hover:border-white/50"
                    }`}
                  >
                    <Image
                      src={src}
                      alt="avatar"
                      width={44}
                      height={44}
                      className="object-cover w-full h-full"
                    />
                  </button>
                ))}
              </div>
              {/* Name input */}
              <input
                className="w-full sm:flex-1 bg-white/10 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-yellow-400"
                placeholder="Tên của bạn…"
                value={name}
                maxLength={20}
                onChange={(e) => {
                  setName(e.target.value);
                  onSetName(e.target.value);
                }}
              />
            </div>
          </div>
        </div>

        {/* Create Room Panel */}
        <div className="mx-auto w-full max-w-lg px-4 mb-4">
          {!showCreate ? (
            <button
              onClick={() => setShowCreate(true)}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-xl transition-all shadow-lg"
            >
              ＋ Tạo phòng mới
            </button>
          ) : (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 space-y-3">
              <p className="font-bold text-yellow-300">Tạo phòng mới</p>
              <input
                className="w-full bg-white/10 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-yellow-400"
                placeholder="Tên phòng (để trống = tự động)"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
              />
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  className="flex-1 bg-white/10 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-yellow-400"
                  placeholder="Mật khẩu (tuỳ chọn)"
                  value={roomPassword}
                  type="password"
                  onChange={(e) => setRoomPassword(e.target.value)}
                />
                <select
                  className="bg-white/10 border border-white/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-yellow-400"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                >
                  {[5, 6, 7, 8, 9, 10, 12, 15, 20].map((n) => (
                    <option key={n} value={n} className="bg-gray-800">
                      {n} người
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  disabled={!name.trim()}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black font-bold py-2 rounded-lg transition-all"
                >
                  Tạo phòng
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-lg transition-all"
                >
                  Huỷ
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Room List */}
        <div className="mx-auto w-full max-w-lg px-4 flex-1 overflow-y-auto pb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Image
                src="/assets/ma-soi/ui/moon.png"
                alt="phòng"
                width={14}
                height={14}
                className="opacity-50"
              />
              <p className="text-xs uppercase tracking-widest text-white/50">
                Phòng đang mở ({roomList.length})
              </p>
            </div>
            <button
              onClick={onFetchRooms}
              className="text-xs text-white/50 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/10"
            >
              🔄 Làm mới
            </button>
          </div>

          {roomList.length === 0 ? (
            <div className="text-center text-white/30 py-12">
              <Image
                src="/assets/ma-soi/ui/moon.png"
                alt="trăng"
                width={48}
                height={48}
                className="mx-auto mb-3 opacity-30"
              />
              <p>Chưa có phòng nào. Hãy tạo phòng đầu tiên!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {roomList.map((room) => (
                <div
                  key={room.id}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 flex items-center justify-between hover:bg-white/15 transition-all"
                >
                  <div className="min-w-0 flex items-center gap-3">
                    <Image
                      src={
                        room.status === "playing"
                          ? "/assets/ma-soi/ui/wolf-paw.png"
                          : "/assets/ma-soi/ui/moon.png"
                      }
                      alt="room"
                      width={24}
                      height={24}
                      className="flex-shrink-0 opacity-70"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold truncate">
                          {room.name}
                        </span>
                        {room.hasPassword && (
                          <span className="text-yellow-400 text-xs">🔒</span>
                        )}
                      </div>
                      <div className="text-white/50 text-xs mt-0.5">
                        {room.players.length}/{room.maxPlayers} người
                        {room.status === "playing" && (
                          <span className="ml-2 text-green-400">
                            ● Đang chơi
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleJoinClick(room)}
                    disabled={
                      room.status === "playing" ||
                      room.players.length >= room.maxPlayers ||
                      !name.trim()
                    }
                    className="ml-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-4 py-1.5 rounded-lg text-sm transition-all flex-shrink-0"
                  >
                    {room.status === "playing" ? "Đang chơi" : "Tham gia"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Join Password Modal */}
      {joinPasswordId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/20 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-bold text-white text-center">
              Nhập mật khẩu phòng
            </h3>
            <input
              className="w-full bg-white/10 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-yellow-400"
              placeholder="Mật khẩu…"
              type="password"
              value={joinPassword}
              onChange={(e) => setJoinPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoinWithPassword()}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleJoinWithPassword}
                className="flex-1 bg-purple-600 hover:bg-purple-500 font-bold py-2 rounded-lg transition-all"
              >
                Xác nhận
              </button>
              <button
                onClick={() => setJoinPasswordId(null)}
                className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-lg transition-all"
              >
                Huỷ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
