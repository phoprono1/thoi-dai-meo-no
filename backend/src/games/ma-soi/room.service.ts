import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
    MaSoiRoom,
    MaSoiPlayer,
    GameConfig,
    DEFAULT_CONFIG,
    PlayerStatus,
    Team,
} from './types.js';

@Injectable()
export class MaSoiRoomService {
    private rooms = new Map<string, MaSoiRoom>();
    // socketId → { roomId, playerId }
    private socketMap = new Map<string, { roomId: string; playerId: string }>();

    // ── Room CRUD ───────────────────────────────────────────────

    createRoom(opts: {
        hostSocketId: string;
        playerName: string;
        avatar?: string;
        roomName: string;
        password?: string;
        maxPlayers?: number;
    }): { room: MaSoiRoom; playerId: string } {
        const { hostSocketId: socketId, playerName, avatar: playerAvatar = '', roomName, password, maxPlayers = 10 } = opts;
        const playerId = uuidv4();
        const roomId = Math.random().toString(36).slice(2, 8).toUpperCase();

        const host: MaSoiPlayer = this.makePlayer(playerId, socketId, playerName, playerAvatar, true);

        const room: MaSoiRoom = {
            id: roomId,
            name: roomName || `Phòng ${roomId}`,
            password,
            hostId: playerId,
            maxPlayers: Math.min(Math.max(maxPlayers, 5), 20),
            players: [host],
            status: 'waiting',
            config: { ...DEFAULT_CONFIG },
            gameState: null,
            createdAt: Date.now(),
        };

        this.rooms.set(roomId, room);
        this.socketMap.set(socketId, { roomId, playerId });
        return { room, playerId };
    }

    joinRoom(opts: {
        socketId: string;
        playerName: string;
        avatar?: string;
        roomId: string;
        password?: string;
    }): { room: MaSoiRoom; playerId: string } | { error: string } {
        const { socketId, playerName, avatar: playerAvatar = '', roomId, password } = opts;
        const room = this.rooms.get(roomId);
        if (!room) return { error: 'Phòng không tồn tại.' };
        if (room.status !== 'waiting') return { error: 'Trận đấu đã bắt đầu.' };
        if (room.players.length >= room.maxPlayers) return { error: 'Phòng đã đầy.' };
        if (room.password && room.password !== password) return { error: 'Sai mật khẩu.' };

        const playerId = uuidv4();
        const player = this.makePlayer(playerId, socketId, playerName, playerAvatar, false);
        room.players.push(player);
        this.socketMap.set(socketId, { roomId, playerId });
        return { room, playerId };
    }

    leaveRoom(socketId: string): { room: MaSoiRoom | null; playerId: string; wasHost: boolean; roomDestroyed: boolean } | null {
        const entry = this.socketMap.get(socketId);
        if (!entry) return null;
        this.socketMap.delete(socketId);

        const { roomId, playerId } = entry;
        const room = this.rooms.get(roomId);
        if (!room) return null;

        const wasHost = room.hostId === playerId;
        room.players = room.players.filter((p) => p.id !== playerId);

        if (room.players.length === 0) {
            this.rooms.delete(roomId);
            return { room: null, playerId, wasHost, roomDestroyed: true };
        }

        if (wasHost && room.status === 'waiting') {
            room.hostId = room.players[0].id;
            room.players[0].isHost = true;
        }

        return { room, playerId, wasHost, roomDestroyed: false };
    }

    kickPlayer(
        hostSocketId: string,
        targetPlayerId: string,
    ): { room: MaSoiRoom; kickedSocketId: string } | { error: string } {
        const entry = this.socketMap.get(hostSocketId);
        if (!entry) return { error: 'Không tìm thấy phòng.' };
        const room = this.rooms.get(entry.roomId);
        if (!room) return { error: 'Phòng không tồn tại.' };
        if (room.hostId !== entry.playerId) return { error: 'Chỉ host mới có thể kick.' };
        if (room.status !== 'waiting') return { error: 'Chỉ kick khi đang ở phòng chờ.' };

        const target = room.players.find((p) => p.id === targetPlayerId);
        if (!target) return { error: 'Người chơi không tồn tại.' };

        const kickedSocketId = target.socketId;
        room.players = room.players.filter((p) => p.id !== targetPlayerId);
        this.socketMap.delete(kickedSocketId);
        return { room, kickedSocketId };
    }

    reconnect(
        newSocketId: string,
        roomId: string,
        playerId: string,
    ): { room: MaSoiRoom; player: MaSoiPlayer } | { error: string } {
        const room = this.rooms.get(roomId);
        if (!room) return { error: 'Phòng không tồn tại.' };
        const player = room.players.find((p) => p.id === playerId);
        if (!player) return { error: 'Người chơi không tìm thấy.' };
        if (player.socketId && player.socketId !== newSocketId) {
            this.socketMap.delete(player.socketId);
        }
        player.socketId = newSocketId;
        if (player.status === PlayerStatus.DISCONNECTED) player.status = PlayerStatus.ALIVE;
        if (player.disconnectTimeout) {
            clearTimeout(player.disconnectTimeout);
            player.disconnectTimeout = null;
        }
        this.socketMap.set(newSocketId, { roomId, playerId });
        return { room, player };
    }

    canStartGame(hostSocketId: string): { ok: true } | { error: string } {
        const entry = this.socketMap.get(hostSocketId);
        if (!entry) return { error: 'Không tìm thấy phòng.' };
        const room = this.rooms.get(entry.roomId);
        if (!room) return { error: 'Phòng không tồn tại.' };
        if (room.hostId !== entry.playerId) return { error: 'Chỉ host mới bắt đầu được.' };
        if (room.status !== 'waiting') return { error: 'Trận đã bắt đầu rồi.' };
        const n = room.players.length;
        if (n < 5) return { error: 'Cần ít nhất 5 người chơi.' };
        if (n > room.maxPlayers) return { error: 'Quá nhiều người chơi.' };
        // Validate role counts sum matches player count
        const totalRoles = Object.values(room.config.roleCounts).reduce((s, v) => s + (v ?? 0), 0);
        if (totalRoles !== n) return { error: `Tổng số vai trò (${totalRoles}) phải bằng số người chơi (${n}).` };
        return { ok: true };
    }

    updateConfig(
        socketId: string,
        patch: Partial<GameConfig>,
    ): MaSoiRoom | { error: string } {
        const entry = this.socketMap.get(socketId);
        if (!entry) return { error: 'Không tìm thấy phòng.' };
        const room = this.rooms.get(entry.roomId);
        if (!room) return { error: 'Phòng không tồn tại.' };
        if (room.hostId !== entry.playerId) return { error: 'Chỉ host mới được thay đổi cài đặt.' };
        if (room.status !== 'waiting') return { error: 'Không thể thay đổi khi đang chơi.' };

        room.config = { ...room.config, ...patch };
        return room;
    }

    setReady(socketId: string, ready: boolean): MaSoiRoom | null {
        const entry = this.socketMap.get(socketId);
        if (!entry) return null;
        const room = this.rooms.get(entry.roomId);
        if (!room) return null;
        const player = room.players.find((p) => p.id === entry.playerId);
        if (player) player.isReady = ready;
        return room;
    }

    // ── Queries ─────────────────────────────────────────────────

    getRoom(roomId: string): MaSoiRoom | undefined {
        return this.rooms.get(roomId);
    }

    getRoomBySocket(socketId: string): { room: MaSoiRoom; player: MaSoiPlayer } | null {
        const entry = this.socketMap.get(socketId);
        if (!entry) return null;
        const room = this.rooms.get(entry.roomId);
        if (!room) return null;
        const player = room.players.find((p) => p.id === entry.playerId) ?? null;
        if (!player) return null;
        return { room, player };
    }

    getPublicRooms(): MaSoiRoom[] {
        return Array.from(this.rooms.values()).filter((r) => !r.password);
    }

    removeSocketMapping(socketId: string): void {
        this.socketMap.delete(socketId);
    }

    // ── Helpers ─────────────────────────────────────────────────

    private makePlayer(
        id: string,
        socketId: string,
        name: string,
        avatar: string,
        isHost: boolean,
    ): MaSoiPlayer {
        return {
            id,
            socketId,
            name,
            avatar,
            role: null,
            team: Team.NONE,
            status: PlayerStatus.ALIVE,
            isHost,
            isReady: false,
            isProtected: false,
            isInjured: false,
            elderLives: 2,
            witchSaveUsed: false,
            witchKillUsed: false,
            doctorLastSaved: null,
            bodyguardLastProtected: null,
            foxActive: true,
            alphaWolfUsed: false,
            isLoversLink: null,
            hasShot: false,
            idolId: null,
            disconnectTimeout: null,
        };
    }

    /** Xoá các phòng đang chờ đã tồn tại quá 30 phút (zombie rooms) */
    cleanupZombieRooms(): void {
        const STALE_MS = 30 * 60 * 1000; // 30 phút
        const now = Date.now();
        for (const [roomId, room] of this.rooms.entries()) {
            if (room.status !== 'waiting') continue;
            if (now - room.createdAt > STALE_MS) {
                room.players.forEach((p) => {
                    if (p.socketId) this.socketMap.delete(p.socketId);
                });
                this.rooms.delete(roomId);
            }
        }
    }
}
