import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
    Room,
    Player,
    RoomStatus,
    ClientRoom,
    ClientPlayer,
} from './types.js';

@Injectable()
export class RoomService {
    private rooms: Map<string, Room> = new Map();
    private playerRooms: Map<string, string> = new Map(); // socketId -> roomId

    createRoom(
        name: string,
        hostName: string,
        hostAvatar: string,
        hostSocketId: string,
        password: string | null,
        maxPlayers: number,
    ): Room {
        const roomId = uuidv4().slice(0, 8).toUpperCase();
        const playerId = uuidv4();

        const host: Player = {
            id: playerId,
            socketId: hostSocketId,
            name: hostName,
            avatar: hostAvatar,
            hand: [],
            isAlive: true,
            isReady: false,
            isDisconnected: false,
            disconnectTimeout: null,
        };

        const room: Room = {
            id: roomId,
            name,
            password,
            hostId: playerId,
            maxPlayers: Math.min(Math.max(maxPlayers, 2), 10),
            players: [host],
            status: RoomStatus.WAITING,
            gameState: null,
        };

        this.rooms.set(roomId, room);
        this.playerRooms.set(hostSocketId, roomId);

        return room;
    }

    joinRoom(
        roomId: string,
        playerName: string,
        playerAvatar: string,
        socketId: string,
        password?: string,
    ): { success: boolean; error?: string; room?: Room; playerId?: string } {
        const room = this.rooms.get(roomId);
        if (!room) {
            return { success: false, error: 'Phòng không tồn tại!' };
        }

        if (room.status !== RoomStatus.WAITING) {
            return { success: false, error: 'Trò chơi đã bắt đầu!' };
        }

        if (room.players.length >= room.maxPlayers) {
            return { success: false, error: 'Phòng đã đầy!' };
        }

        if (room.password && room.password !== password) {
            return { success: false, error: 'Mật khẩu không đúng!' };
        }

        // Check if player name is taken in this room
        const nameTaken = room.players.some(
            (p) => p.name.toLowerCase() === playerName.toLowerCase(),
        );
        if (nameTaken) {
            return {
                success: false,
                error: 'Tên này đã có người dùng trong phòng!',
            };
        }

        const playerId = uuidv4();
        const player: Player = {
            id: playerId,
            socketId,
            name: playerName,
            avatar: playerAvatar,
            hand: [],
            isAlive: true,
            isReady: false,
            isDisconnected: false,
            disconnectTimeout: null,
        };

        room.players.push(player);
        this.playerRooms.set(socketId, roomId);

        return { success: true, room, playerId };
    }

    leaveRoom(
        socketId: string,
    ): { room: Room; player: Player; wasHost: boolean } | null {
        const roomId = this.playerRooms.get(socketId);
        if (!roomId) return null;

        const room = this.rooms.get(roomId);
        if (!room) return null;

        const playerIndex = room.players.findIndex((p) => p.socketId === socketId);
        if (playerIndex === -1) return null;

        const player = room.players[playerIndex];
        const wasHost = player.id === room.hostId;

        room.players.splice(playerIndex, 1);
        this.playerRooms.delete(socketId);

        // If room is empty, delete it
        if (room.players.length === 0) {
            this.rooms.delete(roomId);
            return { room, player, wasHost };
        }

        // Transfer host if needed
        if (wasHost && room.players.length > 0) {
            room.hostId = room.players[0].id;
        }

        return { room, player, wasHost };
    }

    deleteRoom(roomId: string): void {
        const room = this.rooms.get(roomId);
        if (room) {
            // Remove all players from playerRooms map
            room.players.forEach(p => this.playerRooms.delete(p.socketId));
            this.rooms.delete(roomId);
            console.log(`[RoomService] Deleted room ${roomId}`);
        }
    }

    listRooms(): ClientRoom[] {
        const rooms: ClientRoom[] = [];
        this.rooms.forEach((room) => {
            rooms.push(this.toClientRoom(room));
        });
        return rooms;
    }

    getRoom(roomId: string): Room | undefined {
        return this.rooms.get(roomId);
    }

    getRoomBySocketId(socketId: string): Room | undefined {
        const roomId = this.playerRooms.get(socketId);
        if (!roomId) return undefined;
        return this.rooms.get(roomId);
    }

    getPlayerBySocketId(
        socketId: string,
    ): { room: Room; player: Player } | undefined {
        const room = this.getRoomBySocketId(socketId);
        if (!room) return undefined;
        const player = room.players.find((p) => p.socketId === socketId);
        if (!player) return undefined;
        return { room, player };
    }

    setPlayerReady(socketId: string, ready: boolean): Room | null {
        const result = this.getPlayerBySocketId(socketId);
        if (!result) return null;
        result.player.isReady = ready;
        return result.room;
    }

    toClientRoom(room: Room): ClientRoom {
        return {
            id: room.id,
            name: room.name,
            hasPassword: !!room.password,
            hostId: room.hostId,
            maxPlayers: room.maxPlayers,
            players: room.players.map((p) => this.toClientPlayer(p)),
            status: room.status,
        };
    }

    toClientPlayer(player: Player): ClientPlayer {
        return {
            id: player.id,
            name: player.name,
            avatar: player.avatar,
            cardCount: player.hand.length,
            isAlive: player.isAlive,
            isReady: player.isReady,
            isDisconnected: player.isDisconnected,
        };
    }

    getPlayerById(playerId: string): { room: Room; player: Player } | undefined {
        for (const room of this.rooms.values()) {
            const player = room.players.find((p) => p.id === playerId);
            if (player) return { room, player };
        }
        return undefined;
    }

    reconnectPlayer(playerId: string, newSocketId: string): { room: Room; player: Player } | undefined {
        const result = this.getPlayerById(playerId);
        if (!result) return undefined;

        const { room, player } = result;

        // Clear disconnect timeout
        if (player.disconnectTimeout) {
            clearTimeout(player.disconnectTimeout);
            player.disconnectTimeout = null;
        }

        // Update socket references
        this.playerRooms.delete(player.socketId);
        player.socketId = newSocketId;
        player.isDisconnected = false;
        this.playerRooms.set(newSocketId, room.id);

        return { room, player };
    }
}
