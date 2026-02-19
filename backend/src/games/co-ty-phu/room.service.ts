import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  MonopolyRoom,
  MonopolyPlayer,
  RoomStatus,
  ClientMonopolyRoom,
  ClientMonopolyPlayer,
  CreateRoomPayload,
  JoinRoomPayload,
  STARTING_MONEY,
} from './types.js';

@Injectable()
export class CoTyPhuRoomService {
  private rooms = new Map<string, MonopolyRoom>();

  // ── Helpers ──────────────────────────────────────────────────
  private toClientPlayer(p: MonopolyPlayer): ClientMonopolyPlayer {
    return {
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      money: p.money,
      position: p.position,
      inJail: p.inJail,
      jailTurns: p.jailTurns,
      getOutOfJailCards: p.getOutOfJailCards,
      isBankrupt: p.isBankrupt,
      isDisconnected: p.isDisconnected,
    };
  }

  toClientRoom(room: MonopolyRoom): ClientMonopolyRoom {
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

  // ── CRUD ─────────────────────────────────────────────────────
  createRoom(
    payload: CreateRoomPayload,
    socketId: string,
  ): { room: MonopolyRoom; player: MonopolyPlayer } {
    const roomId = uuidv4().slice(0, 8).toUpperCase();
    const player: MonopolyPlayer = {
      id: uuidv4(),
      socketId,
      name: payload.playerName.trim().slice(0, 20),
      avatar: payload.playerAvatar,
      money: STARTING_MONEY,
      position: 0,
      inJail: false,
      jailTurns: 0,
      getOutOfJailCards: 0,
      isBankrupt: false,
      isDisconnected: false,
      disconnectTimeout: null,
    };
    const room: MonopolyRoom = {
      id: roomId,
      name: payload.roomName.trim().slice(0, 30) || `Phòng ${roomId}`,
      password: payload.password || null,
      hostId: player.id,
      maxPlayers: Math.min(8, Math.max(2, payload.maxPlayers)),
      players: [player],
      status: RoomStatus.WAITING,
      gameState: null,
    };
    this.rooms.set(roomId, room);
    return { room, player };
  }

  joinRoom(
    payload: JoinRoomPayload,
    socketId: string,
  ): { room: MonopolyRoom; player: MonopolyPlayer } | { error: string } {
    const room = this.rooms.get(payload.roomId);
    if (!room) return { error: 'Không tìm thấy phòng.' };
    if (room.status !== RoomStatus.WAITING)
      return { error: 'Phòng đã bắt đầu trận đấu.' };
    if (room.players.length >= room.maxPlayers)
      return { error: 'Phòng đã đầy.' };
    if (room.password && room.password !== payload.password)
      return { error: 'Sai mật khẩu.' };

    const player: MonopolyPlayer = {
      id: uuidv4(),
      socketId,
      name: payload.playerName.trim().slice(0, 20),
      avatar: payload.playerAvatar,
      money: STARTING_MONEY,
      position: 0,
      inJail: false,
      jailTurns: 0,
      getOutOfJailCards: 0,
      isBankrupt: false,
      isDisconnected: false,
      disconnectTimeout: null,
    };
    room.players.push(player);
    return { room, player };
  }

  reconnect(
    roomId: string,
    playerId: string,
    newSocketId: string,
  ): MonopolyPlayer | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    const player = room.players.find((p) => p.id === playerId);
    if (!player) return null;
    if (player.disconnectTimeout) {
      clearTimeout(player.disconnectTimeout);
      player.disconnectTimeout = null;
    }
    player.socketId = newSocketId;
    player.isDisconnected = false;
    return player;
  }

  markDisconnected(
    socketId: string,
    onTimeout: (roomId: string, playerId: string) => void,
  ): { roomId: string; playerId: string } | null {
    for (const room of this.rooms.values()) {
      const player = room.players.find((p) => p.socketId === socketId);
      if (player) {
        player.isDisconnected = true;
        player.disconnectTimeout = setTimeout(() => {
          onTimeout(room.id, player.id);
        }, 60_000);
        return { roomId: room.id, playerId: player.id };
      }
    }
    return null;
  }

  removePlayerFromRoom(roomId: string, playerId: string): MonopolyRoom | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    if (room.status === RoomStatus.WAITING) {
      room.players = room.players.filter((p) => p.id !== playerId);
      if (room.players.length === 0) {
        this.rooms.delete(roomId);
        return null;
      }
      if (room.hostId === playerId) {
        room.hostId = room.players[0].id;
      }
    }
    return room;
  }

  deleteRoom(roomId: string): void {
    this.rooms.delete(roomId);
  }

  getRoom(roomId: string): MonopolyRoom | null {
    return this.rooms.get(roomId) ?? null;
  }

  findRoomBySocketId(socketId: string): MonopolyRoom | null {
    for (const room of this.rooms.values()) {
      if (room.players.some((p) => p.socketId === socketId)) return room;
    }
    return null;
  }

  findPlayerBySocketId(socketId: string): MonopolyPlayer | null {
    for (const room of this.rooms.values()) {
      const p = room.players.find((pl) => pl.socketId === socketId);
      if (p) return p;
    }
    return null;
  }

  getAllRooms(): ClientMonopolyRoom[] {
    return Array.from(this.rooms.values()).map((r) => this.toClientRoom(r));
  }
}
