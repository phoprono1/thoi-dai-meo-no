import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CoTyPhuRoomService } from './room.service.js';
import { CoTyPhuGameService } from './game.service.js';
import { SocketEvent, RoomStatus } from './types.js';
import type {
  CreateRoomPayload,
  JoinRoomPayload,
  BuildPayload,
  MortgagePayload,
  SellPropertyPayload,
  ChatPayload,
  MonopolyRoom,
} from './types.js';

@WebSocketGateway({
  cors: { origin: '*', methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling'],
})
export class CoTyPhuGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private turnTimers = new Map<string, NodeJS.Timeout>();
  private lobbyClients = new Set<string>();

  constructor(
    private readonly roomService: CoTyPhuRoomService,
    private readonly gameService: CoTyPhuGameService,
  ) {}

  // ════════════════════════════════════════════
  // CONNECTION
  // ════════════════════════════════════════════
  handleConnection(client: Socket) {
    this.lobbyClients.add(client.id);
    client.emit(SocketEvent.ROOM_LIST, this.roomService.getAllRooms());
  }

  handleDisconnect(client: Socket) {
    this.lobbyClients.delete(client.id);

    const info = this.roomService.markDisconnected(
      client.id,
      (roomId, playerId) => this.handleDisconnectTimeout(roomId, playerId),
    );
    if (!info) return;

    const room = this.roomService.getRoom(info.roomId);
    if (!room) return;

    if (room.status === RoomStatus.WAITING) {
      // Remove directly from waiting room
      const updated = this.roomService.removePlayerFromRoom(
        info.roomId,
        info.playerId,
      );
      this.broadcastRoomList();
      if (updated) {
        this.server
          .to(info.roomId)
          .emit(SocketEvent.ROOM_UPDATE, {
            room: this.roomService.toClientRoom(updated),
          });
      }
    } else if (room.status === RoomStatus.PLAYING && room.gameState) {
      this.broadcastGameState(room);
    }
  }

  private handleDisconnectTimeout(roomId: string, playerId: string) {
    const room = this.roomService.getRoom(roomId);
    if (!room) return;

    if (room.status === RoomStatus.WAITING) {
      const updated = this.roomService.removePlayerFromRoom(roomId, playerId);
      this.broadcastRoomList();
      if (updated) {
        this.server
          .to(roomId)
          .emit(SocketEvent.ROOM_UPDATE, {
            room: this.roomService.toClientRoom(updated),
          });
      }
    } else if (room.status === RoomStatus.PLAYING && room.gameState) {
      const gs = room.gameState;
      const player = gs.players.find((p) => p.id === playerId);
      if (player && !player.isBankrupt) {
        // Force bankrupt disconnected player
        const currentPlayer = this.gameService.getCurrentPlayer(gs);
        // If it's their turn, advance first
        if (currentPlayer.id === playerId) {
          this.gameService['bankruptPlayer'](gs, player, null);
          this.gameService['advanceTurn'](gs, room);
        } else {
          this.gameService['bankruptPlayer'](gs, player, null);
        }
        this.broadcastGameState(room);
        if (room.gameState?.winner) this.handleGameOver(room);
      }
    }
  }

  // ════════════════════════════════════════════
  // ROOM EVENTS
  // ════════════════════════════════════════════
  @SubscribeMessage(SocketEvent.ROOM_LIST)
  handleRoomList(@ConnectedSocket() client: Socket) {
    client.emit(SocketEvent.ROOM_LIST, this.roomService.getAllRooms());
  }

  @SubscribeMessage(SocketEvent.ROOM_CREATE)
  handleRoomCreate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: CreateRoomPayload,
  ) {
    if (!payload?.playerName?.trim()) {
      return client.emit(
        SocketEvent.ROOM_ERROR,
        'Tên người chơi không hợp lệ.',
      );
    }

    const { room, player } = this.roomService.createRoom(payload, client.id);
    client.data.playerId = player.id;
    client.data.roomId = room.id;
    client.join(room.id);
    this.lobbyClients.delete(client.id);

    client.emit(SocketEvent.ROOM_UPDATE, {
      room: this.roomService.toClientRoom(room),
      yourPlayerId: player.id,
    });
    this.broadcastRoomList();
  }

  @SubscribeMessage(SocketEvent.ROOM_JOIN)
  handleRoomJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinRoomPayload,
  ) {
    const result = this.roomService.joinRoom(payload, client.id);
    if ('error' in result) {
      return client.emit(SocketEvent.ROOM_ERROR, result.error);
    }

    const { room, player } = result;
    client.data.playerId = player.id;
    client.data.roomId = room.id;
    client.join(room.id);
    this.lobbyClients.delete(client.id);

    const clientRoom = this.roomService.toClientRoom(room);
    this.server.to(room.id).emit(SocketEvent.ROOM_UPDATE, { room: clientRoom });
    client.emit(SocketEvent.ROOM_UPDATE, {
      room: clientRoom,
      yourPlayerId: player.id,
    });
    this.broadcastRoomList();
  }

  @SubscribeMessage(SocketEvent.ROOM_LEAVE)
  handleRoomLeave(@ConnectedSocket() client: Socket) {
    const { playerId, roomId } = client.data;
    if (!roomId || !playerId) return;

    const room = this.roomService.getRoom(roomId);
    if (room?.status === RoomStatus.PLAYING) {
      client.emit(SocketEvent.ROOM_ERROR, 'Không thể rời phòng khi đang chơi.');
      return;
    }

    const isHost = room?.hostId === playerId;

    if (isHost && room) {
      // Host left → dissolve the room and kick all remaining players back to lobby
      client.leave(roomId);
      client.data.roomId = null;
      client.data.playerId = null;
      this.lobbyClients.add(client.id);

      const remaining = room.players.filter((p) => p.id !== playerId);
      remaining.forEach((p) => {
        const sock = this.server.sockets.sockets.get(p.socketId);
        if (sock) {
          sock.emit(SocketEvent.ROOM_UPDATE, { room: null });
          sock.leave(roomId);
          sock.data.roomId = null;
          sock.data.playerId = null;
          this.lobbyClients.add(sock.id);
        }
      });

      this.roomService.deleteRoom(roomId);

      const updatedList = this.roomService.getAllRooms();
      remaining.forEach((p) => {
        this.server.sockets.sockets.get(p.socketId)?.emit(SocketEvent.ROOM_LIST, updatedList);
      });
      client.emit(SocketEvent.ROOM_UPDATE, { room: null });
      client.emit(SocketEvent.ROOM_LIST, updatedList);
      this.broadcastRoomList();
      return;
    }

    // Non-host normal leave
    const updated = this.roomService.removePlayerFromRoom(roomId, playerId);
    client.leave(roomId);
    client.data.roomId = null;
    client.data.playerId = null;
    this.lobbyClients.add(client.id);

    if (updated) {
      const clientRoom = this.roomService.toClientRoom(updated);
      this.server.to(roomId).emit(SocketEvent.ROOM_UPDATE, { room: clientRoom });
    }
    client.emit(SocketEvent.ROOM_UPDATE, { room: null });
    client.emit(SocketEvent.ROOM_LIST, this.roomService.getAllRooms());
    this.broadcastRoomList();
  }

  @SubscribeMessage(SocketEvent.PLAYER_RECONNECT)
  handleReconnect(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; playerId: string },
  ) {
    const player = this.roomService.reconnect(
      payload.roomId,
      payload.playerId,
      client.id,
    );
    if (!player)
      return client.emit(
        SocketEvent.ROOM_ERROR,
        'Không tìm thấy phòng/người chơi.',
      );

    client.data.playerId = player.id;
    client.data.roomId = payload.roomId;
    client.join(payload.roomId);
    this.lobbyClients.delete(client.id);

    const room = this.roomService.getRoom(payload.roomId)!;
    client.emit(SocketEvent.ROOM_UPDATE, {
      room: this.roomService.toClientRoom(room),
      yourPlayerId: player.id,
    });
    if (room.gameState) {
      client.emit(SocketEvent.GAME_STATE, this.gameService.toClientState(room));
    }
  }

  // ════════════════════════════════════════════
  // GAME START
  // ════════════════════════════════════════════
  @SubscribeMessage(SocketEvent.GAME_START)
  handleGameStart(@ConnectedSocket() client: Socket) {
    const { roomId, playerId } = client.data;
    const room = this.roomService.getRoom(roomId);
    if (!room)
      return client.emit(SocketEvent.ROOM_ERROR, 'Không tìm thấy phòng.');
    if (room.hostId !== playerId)
      return client.emit(
        SocketEvent.ROOM_ERROR,
        'Chỉ chủ phòng mới có thể bắt đầu.',
      );
    if (room.players.length < 2)
      return client.emit(SocketEvent.ROOM_ERROR, 'Cần ít nhất 2 người chơi.');
    if (room.status !== RoomStatus.WAITING)
      return client.emit(SocketEvent.ROOM_ERROR, 'Trận đấu đã bắt đầu rồi.');

    const gs = this.gameService.initializeGame(room);
    this.broadcastRoomList();

    // Notify room of status change to 'playing' so frontend exits WaitingRoom
    this.server.to(roomId).emit(SocketEvent.ROOM_UPDATE, {
      room: this.roomService.toClientRoom(room),
    });
    this.server
      .to(roomId)
      .emit(SocketEvent.GAME_STATE, this.gameService.toClientState(room));
    this.startTurnTimer(room);
  }

  // ════════════════════════════════════════════
  // GAME ACTIONS
  // ════════════════════════════════════════════
  @SubscribeMessage(SocketEvent.ACTION_ROLL_DICE)
  handleRollDice(@ConnectedSocket() client: Socket) {
    const room = this.getClientRoom(client);
    if (!room || !room.gameState) return;

    const result = this.gameService.rollDice(room, client.data.playerId);
    if ('error' in result)
      return client.emit(SocketEvent.ROOM_ERROR, result.error);

    this.broadcastGameState(room);
    if (room.gameState.winner) this.handleGameOver(room);
    else this.refreshTurnTimer(room);
  }

  @SubscribeMessage(SocketEvent.ACTION_BUY_PROPERTY)
  handleBuyProperty(@ConnectedSocket() client: Socket) {
    const room = this.getClientRoom(client);
    if (!room || !room.gameState) return;

    const result = this.gameService.buyProperty(room, client.data.playerId);
    if ('error' in result)
      return client.emit(SocketEvent.ROOM_ERROR, result.error);

    this.broadcastGameState(room);
    if (room.gameState.winner) this.handleGameOver(room);
  }

  @SubscribeMessage(SocketEvent.ACTION_SKIP_BUY)
  handleSkipBuy(@ConnectedSocket() client: Socket) {
    const room = this.getClientRoom(client);
    if (!room || !room.gameState) return;

    const result = this.gameService.skipBuy(room, client.data.playerId);
    if ('error' in result)
      return client.emit(SocketEvent.ROOM_ERROR, result.error);
    this.broadcastGameState(room);
  }

  @SubscribeMessage(SocketEvent.ACTION_BUILD)
  handleBuild(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: BuildPayload,
  ) {
    const room = this.getClientRoom(client);
    if (!room || !room.gameState) return;

    const result = this.gameService.buildAction(
      room,
      client.data.playerId,
      payload.tileIndex,
      payload.action,
    );
    if ('error' in result)
      return client.emit(SocketEvent.ROOM_ERROR, result.error);
    this.broadcastGameState(room);
  }

  @SubscribeMessage(SocketEvent.ACTION_MORTGAGE)
  handleMortgage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: MortgagePayload,
  ) {
    const room = this.getClientRoom(client);
    if (!room || !room.gameState) return;

    const result = this.gameService.mortgageAction(
      room,
      client.data.playerId,
      payload.tileIndex,
      payload.action,
    );
    if ('error' in result)
      return client.emit(SocketEvent.ROOM_ERROR, result.error);
    this.broadcastGameState(room);
  }

  @SubscribeMessage(SocketEvent.ACTION_SELL_PROPERTY)
  handleSellProperty(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SellPropertyPayload,
  ) {
    const room = this.getClientRoom(client);
    if (!room || !room.gameState) return;

    const result = this.gameService.sellPropertyBack(
      room,
      client.data.playerId,
      payload.tileIndex,
    );
    if ('error' in result)
      return client.emit(SocketEvent.ROOM_ERROR, result.error);

    this.broadcastGameState(room);
    if (room.gameState.winner) this.handleGameOver(room);
  }

  @SubscribeMessage(SocketEvent.ACTION_PAY_JAIL)
  handlePayJail(@ConnectedSocket() client: Socket) {
    const room = this.getClientRoom(client);
    if (!room || !room.gameState) return;

    const result = this.gameService.payJailFine(room, client.data.playerId);
    if ('error' in result)
      return client.emit(SocketEvent.ROOM_ERROR, result.error);
    this.broadcastGameState(room);
  }

  @SubscribeMessage(SocketEvent.ACTION_USE_JAIL_CARD)
  handleUseJailCard(@ConnectedSocket() client: Socket) {
    const room = this.getClientRoom(client);
    if (!room || !room.gameState) return;

    const result = this.gameService.useJailCard(room, client.data.playerId);
    if ('error' in result)
      return client.emit(SocketEvent.ROOM_ERROR, result.error);
    this.broadcastGameState(room);
  }

  @SubscribeMessage(SocketEvent.ACTION_END_TURN)
  handleEndTurn(@ConnectedSocket() client: Socket) {
    const room = this.getClientRoom(client);
    if (!room || !room.gameState) return;

    const result = this.gameService.endTurn(room, client.data.playerId);
    if ('error' in result)
      return client.emit(SocketEvent.ROOM_ERROR, result.error);

    this.broadcastGameState(room);
    this.refreshTurnTimer(room);
  }

  @SubscribeMessage(SocketEvent.ACTION_SURRENDER)
  handleSurrender(@ConnectedSocket() client: Socket) {
    const { playerId, roomId } = client.data;
    if (!playerId || !roomId) return;
    const room = this.roomService.getRoom(roomId);
    if (!room?.gameState) return;
    const gs = room.gameState;
    const player = gs.players.find((p) => p.id === playerId);
    if (!player || player.isBankrupt) return;

    const currentPlayer = this.gameService.getCurrentPlayer(gs);
    this.gameService['bankruptPlayer'](gs, player, null);
    if (currentPlayer.id === playerId) {
      this.gameService['advanceTurn'](gs, room);
    }
    this.broadcastGameState(room);
    if (room.gameState?.winner) this.handleGameOver(room);
    else this.refreshTurnTimer(room);
  }

  // ════════════════════════════════════════════
  // CHAT
  // ════════════════════════════════════════════
  @SubscribeMessage(SocketEvent.CHAT_SEND)
  handleChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ChatPayload,
  ) {
    const room = this.getClientRoom(client);
    if (!room) return;
    const player = room.players.find((p) => p.id === client.data.playerId);
    if (!player) return;

    this.server.to(room.id).emit(SocketEvent.CHAT_MESSAGE, {
      playerName: player.name,
      message: payload.message?.slice(0, 200) ?? '',
      timestamp: Date.now(),
    });
  }

  // ════════════════════════════════════════════
  // HELPERS
  // ════════════════════════════════════════════
  private getClientRoom(client: Socket): MonopolyRoom | null {
    return this.roomService.getRoom(client.data.roomId) ?? null;
  }

  private broadcastGameState(room: MonopolyRoom) {
    this.server
      .to(room.id)
      .emit(SocketEvent.GAME_STATE, this.gameService.toClientState(room));
  }

  private broadcastRoomList() {
    const rooms = this.roomService.getAllRooms();
    for (const id of this.lobbyClients) {
      this.server.to(id).emit(SocketEvent.ROOM_LIST, rooms);
    }
  }

  private handleGameOver(room: MonopolyRoom) {
    this.clearTurnTimer(room.id);
    const gs = room.gameState!;
    const winner = gs.players.find((p) => p.id === gs.winner);
    this.server.to(room.id).emit(SocketEvent.GAME_OVER, {
      winnerId: gs.winner,
      winnerName: winner?.name ?? 'Unknown',
    });
    room.status = RoomStatus.FINISHED;
    this.broadcastRoomList();
  }

  // ── Turn timers ──────────────────────────────
  private startTurnTimer(room: MonopolyRoom) {
    this.clearTurnTimer(room.id);
    const gs = room.gameState!;
    const timer = setTimeout(() => {
      const currentPlayer = this.gameService.getCurrentPlayer(gs);
      // Auto-roll dice if player hasn't rolled yet
      if (gs.diceRoll === null) {
        this.gameService.rollDice(room, currentPlayer.id);
      }
      // Skip pending buy prompt
      if (gs.pendingAction?.type === 'buy_property') {
        this.gameService.skipBuy(room, currentPlayer.id);
      }
      // End turn (also ends double turns on timeout to prevent infinite looping)
      if (gs.diceRoll !== null && gs.pendingAction === null) {
        this.gameService.endTurn(room, currentPlayer.id);
      }
      this.broadcastGameState(room);
      if (room.gameState?.winner) this.handleGameOver(room);
      else this.refreshTurnTimer(room);
    }, gs.turnTimeLimit * 1000);
    this.turnTimers.set(room.id, timer);
  }

  private refreshTurnTimer(room: MonopolyRoom) {
    if (room.gameState && !room.gameState.winner) {
      this.startTurnTimer(room);
    }
  }

  private clearTurnTimer(roomId: string) {
    const t = this.turnTimers.get(roomId);
    if (t) {
      clearTimeout(t);
      this.turnTimers.delete(roomId);
    }
  }
}
