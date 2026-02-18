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
import { RoomService } from './room.service.js';
import { GameService } from './game.service.js';
import { ChatService } from './chat.service.js';
import {
    SocketEvent,
    RoomStatus,
} from './types.js';
import type {
    CreateRoomPayload,
    JoinRoomPayload,
    PlayCardPayload,
    DrawCardPayload,
    DefusePayload,
    GiveCardPayload,
    ChatSendPayload,
    Room,
} from './types.js';

const TURN_TIME_LIMIT = 30; // seconds
const DISCONNECT_GRACE_PERIOD = 30_000; // 30 seconds
const FAVOR_TIMEOUT = 30_000; // 30 seconds to give a card

@WebSocketGateway({
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
})
export class GameGateway
    implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    // Track turn timers per room
    private turnTimers: Map<string, NodeJS.Timeout> = new Map();
    private turnIntervals: Map<string, NodeJS.Timeout> = new Map();
    private actionTimers: Map<string, NodeJS.Timeout> = new Map(); // Timer for delayed actions

    // favor timers: roomId -> timeout for favor_give pending action
    private favorTimers: Map<string, NodeJS.Timeout> = new Map();
    // defuse timers: roomId -> timeout for auto-defuse when player is idle
    private defuseTimers: Map<string, NodeJS.Timeout> = new Map();
    // delete timers: roomId -> timeout for auto-delete after game over
    private deleteTimers: Map<string, NodeJS.Timeout> = new Map();
    // lobby clients: socketIds of clients in the lobby (not in a room)
    private lobbyClients: Set<string> = new Set();
    // restart votes: roomId -> Set of playerIds who voted to restart
    private restartVotes: Map<string, Set<string>> = new Map();

    constructor(
        private readonly roomService: RoomService,
        private readonly gameService: GameService,
        private readonly chatService: ChatService,
    ) { }

    handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
        // New connection starts in lobby
        this.lobbyClients.add(client.id);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
        this.lobbyClients.delete(client.id);
        const result = this.roomService.getPlayerBySocketId(client.id);
        if (!result) return;

        const { room, player } = result;

        // If game is in progress, use grace period instead of removing
        if (room.status === RoomStatus.PLAYING && room.gameState && player.isAlive) {
            player.isDisconnected = true;

            // System message
            const sysMsg = this.chatService.sendSystemMessage(
                room.id,
                `⚠️ ${player.name} mất kết nối! Có 30 giây để quay lại...`,
            );
            this.server.to(room.id).emit(SocketEvent.CHAT_MESSAGE, sysMsg);

            // Broadcast updated state
            this.broadcastRoomUpdate(room);
            this.broadcastGameState(room);

            // Set grace period timeout
            player.disconnectTimeout = setTimeout(() => {
                // Player didn't reconnect in time → eliminate
                player.isAlive = false;
                player.isDisconnected = false;
                // Remove stale socketId mapping so it doesn't block future lookups
                this.roomService.removePlayerRoomMapping(player.socketId);

                const elimMsg = this.chatService.sendSystemMessage(
                    room.id,
                    `💀 ${player.name} không quay lại kịp và bị loại!`,
                );
                this.server.to(room.id).emit(SocketEvent.CHAT_MESSAGE, elimMsg);

                // Check if game should end
                const gameEnded = this.checkGameOver(room);

                // Always remove eliminated player from turn order (prevents dead player showing as current)
                // Only advance turn + restart timer if it was their turn
                if (!gameEnded && room.gameState) {
                    const wasTheirTurn =
                        room.gameState.turnOrder[room.gameState.currentPlayerIndex] === player.id;
                    this.gameService.advanceTurnAfterElimination(room, player.id);
                    if (wasTheirTurn) {
                        this.startTurnTimer(room);
                    }
                }

                this.broadcastGameState(room);
                this.broadcastRoomUpdate(room);
                this.emitRoomListToLobby();
            }, DISCONNECT_GRACE_PERIOD);

            return;
        }

        // Normal leave (lobby/waiting)
        const leaveResult = this.roomService.leaveRoom(client.id);
        if (!leaveResult) return;

        const { room: leftRoom, player: leftPlayer } = leaveResult;

        // If room was deleted (last player left), clean up timers and chat
        if (!this.roomService.getRoom(leftRoom.id)) {
            this.clearTurnTimer(leftRoom.id);
            if (this.actionTimers.has(leftRoom.id)) {
                clearTimeout(this.actionTimers.get(leftRoom.id));
                this.actionTimers.delete(leftRoom.id);
            }
            this.chatService.clearRoom(leftRoom.id);
            // Client back in lobby after last player left
            this.lobbyClients.add(client.id);
            this.emitRoomListToLobby();
            return;
        }

        this.server.to(leftRoom.id).emit(SocketEvent.ROOM_UPDATE, {
            room: this.roomService.toClientRoom(leftRoom),
        });

        const sysMsg = this.chatService.sendSystemMessage(
            leftRoom.id,
            `${leftPlayer.name} đã rời phòng 👋`,
        );
        this.server.to(leftRoom.id).emit(SocketEvent.CHAT_MESSAGE, sysMsg);
        this.emitRoomListToLobby();
    }

    // ===================== TURN TIMER =====================

    private startFavorTimerIfNeeded(room: Room): void {
        if (room.gameState?.pendingAction?.type !== 'favor_give') return;
        const favorTargetId = room.gameState.pendingAction.playerId;
        const favorTarget = room.players.find(p => p.id === favorTargetId);
        if (!favorTarget || favorTarget.hand.length === 0) return;

        if (this.favorTimers.has(room.id)) {
            clearTimeout(this.favorTimers.get(room.id));
        }

        const favorTimer = setTimeout(() => {
            if (!room.gameState || room.gameState.pendingAction?.type !== 'favor_give') return;
            if (favorTarget.hand.length === 0) return;
            // Auto-pick a random card
            const randomCard = favorTarget.hand[Math.floor(Math.random() * favorTarget.hand.length)];
            const autoResult = this.gameService.handleGiveCard(room, favorTarget.id, randomCard.id);
            if (autoResult.success) {
                const timeoutMsg = this.chatService.sendSystemMessage(
                    room.id,
                    `⏰ ${favorTarget.name} không chọn bài — tự động cho 1 lá ngẫu nhiên!`,
                );
                this.server.to(room.id).emit(SocketEvent.CHAT_MESSAGE, timeoutMsg);
                this.server.to(room.id).emit(SocketEvent.GAME_ACTION, { action: autoResult.action });
                this.broadcastGameState(room);
                this.startTurnTimer(room);
            }
            this.favorTimers.delete(room.id);
        }, FAVOR_TIMEOUT);

        this.favorTimers.set(room.id, favorTimer);
    }

    private startTurnTimer(room: Room): void {
        this.clearTurnTimer(room.id);

        if (!room.gameState || room.status !== RoomStatus.PLAYING) return;

        room.gameState.turnStartTime = Date.now();

        // Broadcast countdown every second
        const interval = setInterval(() => {
            if (!room.gameState || room.status !== RoomStatus.PLAYING) {
                this.clearTurnTimer(room.id);
                return;
            }

            const elapsed = (Date.now() - room.gameState.turnStartTime) / 1000;
            const remaining = Math.max(0, TURN_TIME_LIMIT - elapsed);

            this.server.to(room.id).emit(SocketEvent.GAME_TURN_TIMER, {
                remaining: Math.round(remaining),
                currentPlayerId: room.gameState.turnOrder[room.gameState.currentPlayerIndex],
            });
        }, 1000);
        this.turnIntervals.set(room.id, interval);

        // Auto-draw when time runs out
        const timer = setTimeout(() => {
            if (!room.gameState || room.status !== RoomStatus.PLAYING) return;

            const currentPlayerId = room.gameState.turnOrder[room.gameState.currentPlayerIndex];
            const player = room.players.find(p => p.id === currentPlayerId);
            if (!player || !player.isAlive) return;

            // Auto-draw card
            const sysMsg = this.chatService.sendSystemMessage(
                room.id,
                `⏰ ${player.name} hết thời gian! Tự động bốc bài...`,
            );
            this.server.to(room.id).emit(SocketEvent.CHAT_MESSAGE, sysMsg);

            const result = this.gameService.drawCard(room, currentPlayerId);
            if (result.success) {
                this.server.to(room.id).emit(SocketEvent.GAME_ACTION, {
                    action: result.action,
                });

                if (result.exploded) {
                    this.server.to(room.id).emit(SocketEvent.GAME_PLAYER_ELIMINATED, {
                        playerId: currentPlayerId,
                        playerName: player.name,
                    });

                    const elimMsg = this.chatService.sendSystemMessage(
                        room.id,
                        `💥 ${player.name} đã bị Pháo Mèo loại!`,
                    );
                    this.server.to(room.id).emit(SocketEvent.CHAT_MESSAGE, elimMsg);

                    if (this.checkGameOver(room)) return;
                }

                this.broadcastGameState(room);
                this.startTurnTimer(room);
            }
        }, TURN_TIME_LIMIT * 1000);
        this.turnTimers.set(room.id, timer);
    }

    private clearTurnTimer(roomId: string): void {
        const timer = this.turnTimers.get(roomId);
        if (timer) {
            clearTimeout(timer);
            this.turnTimers.delete(roomId);
        }
        const interval = this.turnIntervals.get(roomId);
        if (interval) {
            clearInterval(interval);
            this.turnIntervals.delete(roomId);
        }
        // Also clear defuse timer when turn timer is cleared
        if (this.defuseTimers.has(roomId)) {
            clearTimeout(this.defuseTimers.get(roomId));
            this.defuseTimers.delete(roomId);
        }
    }

    /** Emit ROOM_LIST only to clients currently in the lobby (not inside a room) */
    private emitRoomListToLobby(): void {
        const list = this.roomService.listRooms();
        this.lobbyClients.forEach((socketId) => {
            this.server.to(socketId).emit(SocketEvent.ROOM_LIST, list);
        });
    }

    private broadcastGameState(room: Room): void {
        if (!room.gameState) return;
        room.players.forEach((p) => {
            if (!p.isDisconnected) {
                const state = this.gameService.getClientGameState(room, p.id);
                this.server.to(p.socketId).emit(SocketEvent.GAME_STATE, state);
            }
        });
    }

    private broadcastRoomUpdate(room: Room): void {
        this.server.to(room.id).emit(SocketEvent.ROOM_UPDATE, {
            room: this.roomService.toClientRoom(room),
        });
    }

    private checkGameOver(room: Room): boolean {
        if (!room.gameState) return false;
        const alivePlayers = room.players.filter((p) => p.isAlive);
        if (alivePlayers.length <= 1) {
            if (alivePlayers.length === 1) {
                room.gameState.winner = alivePlayers[0].id;
            }
            room.status = RoomStatus.FINISHED;
            this.clearTurnTimer(room.id);

            this.broadcastGameState(room);

            this.server.to(room.id).emit(SocketEvent.GAME_OVER, {
                winnerId: alivePlayers[0]?.id ?? null,
                winner: alivePlayers[0]
                    ? this.roomService.toClientPlayer(alivePlayers[0])
                    : null,
            });

            if (alivePlayers[0]) {
                const sysMsg = this.chatService.sendSystemMessage(
                    room.id,
                    `🏆 ${alivePlayers[0].name} CHIẾN THẮNG! 🎉🎊🎆`,
                );
                this.server.to(room.id).emit(SocketEvent.CHAT_MESSAGE, sysMsg);
            }

            this.emitRoomListToLobby();

            // Auto-delete room after 60s
            const deleteTimer = setTimeout(() => {
                this.clearTurnTimer(room.id);
                if (this.actionTimers.has(room.id)) {
                    clearTimeout(this.actionTimers.get(room.id));
                    this.actionTimers.delete(room.id);
                }
                this.chatService.clearRoom(room.id);
                this.roomService.deleteRoom(room.id);
                this.deleteTimers.delete(room.id);
                this.emitRoomListToLobby();
            }, 60_000);
            this.deleteTimers.set(room.id, deleteTimer);
            // Clear any restart votes accumulated during the finished game
            this.restartVotes.delete(room.id);

            return true;
        }
        return false;
    }

    // ===================== RECONNECT =====================

    @SubscribeMessage(SocketEvent.PLAYER_RECONNECT)
    handleReconnect(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { playerId: string },
    ) {
        const result = this.roomService.reconnectPlayer(payload.playerId, client.id);
        if (!result) {
            client.emit(SocketEvent.ROOM_ERROR, { error: 'Không tìm thấy phiên chơi!' });
            return;
        }

        const { room, player } = result;
        client.join(room.id);
        // Player rejoined a room — no longer in lobby
        this.lobbyClients.delete(client.id);

        const sysMsg = this.chatService.sendSystemMessage(
            room.id,
            `✅ ${player.name} đã quay lại! 🎉`,
        );
        this.server.to(room.id).emit(SocketEvent.CHAT_MESSAGE, sysMsg);

        // Send current state to reconnected player
        client.emit(SocketEvent.ROOM_UPDATE, {
            room: this.roomService.toClientRoom(room),
            playerId: player.id,
        });

        if (room.gameState) {
            const state = this.gameService.getClientGameState(room, player.id);
            client.emit(SocketEvent.GAME_STATE, state);
        }

        // Send chat history
        const history = this.chatService.getMessages(room.id);
        client.emit(SocketEvent.CHAT_HISTORY, history);

        this.broadcastRoomUpdate(room);
        this.broadcastGameState(room);
    }

    // ===================== ROOM EVENTS =====================

    @SubscribeMessage(SocketEvent.ROOM_CREATE)
    handleCreateRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: CreateRoomPayload,
    ) {
        const room = this.roomService.createRoom(
            payload.roomName,
            payload.playerName,
            payload.playerAvatar,
            client.id,
            payload.password || null,
            payload.maxPlayers,
        );

        client.join(room.id);
        // Player left lobby, entered a room
        this.lobbyClients.delete(client.id);

        const playerId = room.players[0].id;

        client.emit(SocketEvent.ROOM_UPDATE, {
            room: this.roomService.toClientRoom(room),
            playerId,
        });

        const sysMsg = this.chatService.sendSystemMessage(
            room.id,
            `${payload.playerName} đã tạo phòng! 🎉`,
        );
        client.emit(SocketEvent.CHAT_MESSAGE, sysMsg);
        this.emitRoomListToLobby();
    }

    @SubscribeMessage(SocketEvent.ROOM_JOIN)
    handleJoinRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: JoinRoomPayload,
    ) {
        const result = this.roomService.joinRoom(
            payload.roomId,
            payload.playerName,
            payload.playerAvatar,
            client.id,
            payload.password,
        );

        if (!result.success) {
            client.emit(SocketEvent.ROOM_ERROR, { error: result.error });
            return;
        }

        client.join(payload.roomId);
        // Player left lobby, entered a room
        this.lobbyClients.delete(client.id);
        client.emit(SocketEvent.ROOM_UPDATE, {
            room: this.roomService.toClientRoom(result.room!),
            playerId: result.playerId,
        });

        client.to(payload.roomId).emit(SocketEvent.ROOM_UPDATE, {
            room: this.roomService.toClientRoom(result.room!),
        });

        const sysMsg = this.chatService.sendSystemMessage(
            payload.roomId,
            `${payload.playerName} đã vào phòng! 🎊`,
        );
        this.server.to(payload.roomId).emit(SocketEvent.CHAT_MESSAGE, sysMsg);

        const history = this.chatService.getMessages(payload.roomId);
        client.emit(SocketEvent.CHAT_HISTORY, history);

        this.emitRoomListToLobby();
    }

    @SubscribeMessage(SocketEvent.ROOM_LEAVE)
    handleLeaveRoom(@ConnectedSocket() client: Socket) {
        // Get room info BEFORE leaving (to check if it's their turn)
        const playerResult = this.roomService.getPlayerBySocketId(client.id);
        const wasPlaying = playerResult?.room?.status === RoomStatus.PLAYING;
        const wasCurrentPlayer = wasPlaying && playerResult?.room?.gameState &&
            playerResult.room.gameState.turnOrder[playerResult.room.gameState.currentPlayerIndex] === playerResult.player.id;

        const result = this.roomService.leaveRoom(client.id);
        if (!result) return;

        const { room, player } = result;
        client.leave(room.id);

        // If they left during their turn, clear timers and auto-advance
        if (wasCurrentPlayer && room.gameState && room.status === RoomStatus.PLAYING) {
            this.clearTurnTimer(room.id);
            if (this.actionTimers.has(room.id)) {
                clearTimeout(this.actionTimers.get(room.id));
                this.actionTimers.delete(room.id);
            }
            if (this.favorTimers.has(room.id)) {
                clearTimeout(this.favorTimers.get(room.id));
                this.favorTimers.delete(room.id);
            }
            // Mark eliminated and advance turn
            player.isAlive = false;
            this.gameService.advanceTurnAfterElimination(room, player.id);
            if (!this.checkGameOver(room)) {
                this.startTurnTimer(room);
            }
        }

        this.broadcastRoomUpdate(room);

        const sysMsg = this.chatService.sendSystemMessage(
            room.id,
            `${player.name} đã rời phòng 👋`,
        );
        this.server.to(room.id).emit(SocketEvent.CHAT_MESSAGE, sysMsg);
        // Player returned to lobby
        // Also remove their restart vote if any
        if (this.restartVotes.has(room.id)) {
            this.restartVotes.get(room.id)!.delete(player.id);
        }
        this.lobbyClients.add(client.id);
        this.emitRoomListToLobby();
    }

    @SubscribeMessage(SocketEvent.ROOM_LIST)
    handleListRooms(@ConnectedSocket() client: Socket) {
        client.emit(SocketEvent.ROOM_LIST, this.roomService.listRooms());
    }

    // ===================== GAME EVENTS =====================

    @SubscribeMessage(SocketEvent.GAME_READY)
    handleReady(@ConnectedSocket() client: Socket) {
        const room = this.roomService.setPlayerReady(client.id, true);
        if (!room) return;
        this.broadcastRoomUpdate(room);
    }

    @SubscribeMessage(SocketEvent.GAME_START)
    handleStartGame(@ConnectedSocket() client: Socket) {
        const result = this.roomService.getPlayerBySocketId(client.id);
        if (!result) return;

        const { room, player } = result;

        if (player.id !== room.hostId) {
            client.emit(SocketEvent.ROOM_ERROR, {
                error: 'Chỉ chủ phòng mới có thể bắt đầu!',
            });
            return;
        }

        const startResult = this.gameService.startGame(room);
        if (!startResult.success) {
            client.emit(SocketEvent.ROOM_ERROR, { error: startResult.error });
            return;
        }

        const sysMsg = this.chatService.sendSystemMessage(
            room.id,
            '🎮 Trò chơi bắt đầu! Chúc may mắn! 🍀',
        );
        this.server.to(room.id).emit(SocketEvent.CHAT_MESSAGE, sysMsg);

        this.broadcastGameState(room);
        this.broadcastRoomUpdate(room);
        this.emitRoomListToLobby();

        // Start turn timer
        this.startTurnTimer(room);
    }

    @SubscribeMessage(SocketEvent.GAME_PLAY_CARD)
    handlePlayCard(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: PlayCardPayload,
    ) {
        const room = this.roomService.getRoom(payload.roomId);
        if (!room || !room.gameState) return;

        const playerResult = this.roomService.getPlayerBySocketId(client.id);
        if (!playerResult) return;

        const result = this.gameService.playCard(
            room,
            playerResult.player.id,
            payload.cardIds,
            payload.targetId,
        );

        if (!result.success) {
            client.emit(SocketEvent.ROOM_ERROR, { error: result.error });
            return;
        }

        this.server.to(room.id).emit(SocketEvent.GAME_ACTION, {
            action: result.action,
        });

        if (result.futureCards) {
            client.emit(SocketEvent.GAME_SEE_FUTURE, {
                cards: result.futureCards,
            });
        }

        if (result.targetHand) {
            client.emit(SocketEvent.GAME_PICK_CARD, {
                cards: result.targetHand,
                source: 'hand',
            });
        }

        if (
            room.gameState.pendingAction?.type === 'pick_card_from_player' &&
            room.gameState.pendingAction.data?.source === 'discard' &&
            room.gameState.pendingAction.playerId === playerResult.player.id
        ) {
            client.emit(SocketEvent.GAME_PICK_CARD, {
                cards: room.gameState.discardPile,
                source: 'discard',
            });
        }

        this.broadcastGameState(room);

        // Check if action is delayed
        if (room.gameState.pendingAction?.type === 'delayed_effect') {
            const actionTimer = setTimeout(() => {
                const resolveResult = this.gameService.resolvePendingAction(room);
                if (resolveResult.success) {
                    this.server.to(room.id).emit(SocketEvent.GAME_ACTION, {
                        action: resolveResult.action || 'Hành động đã được thực thi!',
                    });

                    if (resolveResult.futureCards) {
                        client.emit(SocketEvent.GAME_SEE_FUTURE, {
                            cards: resolveResult.futureCards,
                        });
                    }

                    // Emit pick card event if the resolved action requires it
                    if (
                        room.gameState?.pendingAction?.type === 'pick_card_from_player' &&
                        room.gameState.pendingAction.playerId === playerResult.player.id
                    ) {
                        const pending = room.gameState.pendingAction;
                        if (pending.data?.source === 'discard') {
                            // 5 different cats: pick from discard pile
                            client.emit(SocketEvent.GAME_PICK_CARD, {
                                cards: room.gameState.discardPile,
                                source: 'discard',
                            });
                        } else if (pending.data?.source === 'hand' && pending.targetId) {
                            // 3 same cats: pick from target's hand
                            const target = room.players.find(p => p.id === pending.targetId);
                            if (target) {
                                client.emit(SocketEvent.GAME_PICK_CARD, {
                                    cards: target.hand,
                                    source: 'hand',
                                });
                            }
                        }
                    }

                    this.broadcastGameState(room);
                    // Only restart turn timer if no further pending action (e.g. pick card)
                    if (!room.gameState?.pendingAction) {
                        this.startTurnTimer(room);
                    }
                    // Start favor timeout if needed
                    this.startFavorTimerIfNeeded(room);
                }
                this.actionTimers.delete(room.id);
            }, 5000); // 5 seconds delay

            this.actionTimers.set(room.id, actionTimer);

            // Pause turn timer while waiting
            this.clearTurnTimer(room.id);
        } else {
            // Reset turn timer on immediate action
            this.startTurnTimer(room);
        }
    }

    @SubscribeMessage(SocketEvent.GAME_NOPE)
    handleNope(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { roomId: string }, // Nope payload usually just needs room
    ) {
        const room = this.roomService.getRoom(payload.roomId);
        if (!room || !room.gameState) return;

        const playerResult = this.roomService.getPlayerBySocketId(client.id);
        if (!playerResult) return;

        // Find Nope card in hand -> logic is inside gameService.playCard actually
        // BUT wait, gameService.playCard handles general card playing. 
        // We need to call playCard with NOPE card id.
        // Frontend sends GAME_NOPE with just roomID? 
        // Let's check frontend. Frontend usually calls playCard for Nope too.
        // But if we have specific GAME_NOPE event, let's use it or deprecate it.
        // The Types `NopePayload` exists.

        // Actually, the user might click the "Nope" button which sends GAME_NOPE, 
        // OR drag the card which sends GAME_PLAY_CARD.
        // Let's support GAME_NOPE by finding a Nope card in hand.

        const nopeCard = playerResult.player.hand.find(c => c.type === 'nope');
        if (!nopeCard) {
            client.emit(SocketEvent.ROOM_ERROR, { error: 'Bạn không có lá Nope!' });
            return;
        }

        const result = this.gameService.playCard(room, playerResult.player.id, [nopeCard.id]);
        if (!result.success) {
            client.emit(SocketEvent.ROOM_ERROR, { error: result.error });
            return;
        }

        // If success (Nope played successfully)

        // Clear action timer if it exists (action cancelled)
        if (this.actionTimers.has(room.id)) {
            clearTimeout(this.actionTimers.get(room.id));
            this.actionTimers.delete(room.id);
        }

        this.server.to(room.id).emit(SocketEvent.GAME_ACTION, {
            action: result.action,
        });

        this.broadcastGameState(room);
        this.startTurnTimer(room); // Resume turn timer
    }

    @SubscribeMessage(SocketEvent.GAME_DRAW_CARD)
    handleDrawCard(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: DrawCardPayload,
    ) {
        const room = this.roomService.getRoom(payload.roomId);
        if (!room || !room.gameState) return;

        const playerResult = this.roomService.getPlayerBySocketId(client.id);
        if (!playerResult) return;

        const result = this.gameService.drawCard(room, playerResult.player.id);

        if (!result.success) {
            client.emit(SocketEvent.ROOM_ERROR, { error: result.error });
            return;
        }

        this.server.to(room.id).emit(SocketEvent.GAME_ACTION, {
            action: result.action,
        });

        if (result.exploded) {
            this.server.to(room.id).emit(SocketEvent.GAME_PLAYER_ELIMINATED, {
                playerId: playerResult.player.id,
                playerName: playerResult.player.name,
            });

            const sysMsg = this.chatService.sendSystemMessage(
                room.id,
                `💥 ${playerResult.player.name} đã bị Pháo Mèo loại!`,
            );
            this.server.to(room.id).emit(SocketEvent.CHAT_MESSAGE, sysMsg);
        }

        if (this.checkGameOver(room)) return;

        this.broadcastGameState(room);

        // If player has defuse pending, start 10s auto-defuse timer
        if (room.gameState?.pendingAction?.type === 'defuse_insert') {
            this.clearTurnTimer(room.id); // pause turn timer during defuse
            const defusePlayer = playerResult.player;

            if (this.defuseTimers.has(room.id)) {
                clearTimeout(this.defuseTimers.get(room.id));
            }

            const countdown = setInterval(() => {
                // broadcast countdown so frontend can show it
            }, 1000); // reserved for future countdown emit if needed

            const defuseTimer = setTimeout(() => {
                clearInterval(countdown);
                if (!room.gameState || room.gameState.pendingAction?.type !== 'defuse_insert') {
                    this.defuseTimers.delete(room.id);
                    return;
                }
                // Auto-insert at random position
                const randomPos = Math.floor(Math.random() * (room.gameState.deck.length + 1));
                const autoResult = this.gameService.handleDefuse(room, defusePlayer.id, randomPos);
                if (autoResult.success) {
                    const autoMsg = this.chatService.sendSystemMessage(
                        room.id,
                        `⏰ ${defusePlayer.name} không chọn vị trí — tự động giấu Pháo Mèo ngẫu nhiên!`,
                    );
                    this.server.to(room.id).emit(SocketEvent.CHAT_MESSAGE, autoMsg);
                    this.server.to(room.id).emit(SocketEvent.GAME_ACTION, { action: autoResult.action });
                    this.broadcastGameState(room);
                    this.startTurnTimer(room);
                }
                this.defuseTimers.delete(room.id);
            }, 10_000);

            this.defuseTimers.set(room.id, defuseTimer);
        } else {
            // Reset turn timer (normal draw)
            this.startTurnTimer(room);
        }
    }

    @SubscribeMessage(SocketEvent.GAME_DEFUSE)
    handleDefuse(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: DefusePayload,
    ) {
        const room = this.roomService.getRoom(payload.roomId);
        if (!room || !room.gameState) return;

        const playerResult = this.roomService.getPlayerBySocketId(client.id);
        if (!playerResult) return;

        // Clear auto-defuse timer immediately
        if (this.defuseTimers.has(room.id)) {
            clearTimeout(this.defuseTimers.get(room.id));
            this.defuseTimers.delete(room.id);
        }

        const result = this.gameService.handleDefuse(
            room,
            playerResult.player.id,
            payload.insertPosition,
        );

        if (!result.success) {
            client.emit(SocketEvent.ROOM_ERROR, { error: result.error });
            return;
        }

        this.server.to(room.id).emit(SocketEvent.GAME_ACTION, {
            action: result.action,
        });

        this.broadcastGameState(room);
        this.startTurnTimer(room);
    }

    @SubscribeMessage(SocketEvent.GAME_GIVE_CARD)
    handleGiveCard(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: GiveCardPayload,
    ) {
        const playerResult = this.roomService.getPlayerBySocketId(client.id);
        if (!playerResult) return;

        const { room } = playerResult;
        if (!room.gameState) return;

        const result = this.gameService.handleGiveCard(
            room,
            playerResult.player.id,
            payload.cardId,
        );

        if (!result.success) {
            client.emit(SocketEvent.ROOM_ERROR, { error: result.error });
            return;
        }

        // Clear favor timeout
        if (this.favorTimers.has(room.id)) {
            clearTimeout(this.favorTimers.get(room.id));
            this.favorTimers.delete(room.id);
        }

        this.server.to(room.id).emit(SocketEvent.GAME_ACTION, {
            action: result.action,
        });

        this.broadcastGameState(room);
        this.startTurnTimer(room);
    }

    @SubscribeMessage(SocketEvent.GAME_PICK_CARD)
    handlePickCard(
        @ConnectedSocket() client: Socket,
        @MessageBody()
        payload: { roomId: string; cardId: string },
    ) {
        const room = this.roomService.getRoom(payload.roomId);
        if (!room || !room.gameState) return;

        const playerResult = this.roomService.getPlayerBySocketId(client.id);
        if (!playerResult) return;

        const result = this.gameService.handlePickCard(
            room,
            playerResult.player.id,
            payload.cardId,
        );

        if (!result.success) {
            client.emit(SocketEvent.ROOM_ERROR, { error: result.error });
            return;
        }

        this.server.to(room.id).emit(SocketEvent.GAME_ACTION, {
            action: result.action,
        });

        this.broadcastGameState(room);
        // Resume turn timer after pick card completes
        this.startTurnTimer(room);
    }

    // ===================== CHAT EVENTS =====================

    @SubscribeMessage(SocketEvent.CHAT_SEND)
    handleChatSend(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: ChatSendPayload,
    ) {
        const playerResult = this.roomService.getPlayerBySocketId(client.id);
        if (!playerResult) return;

        const msg = this.chatService.sendMessage(
            payload.roomId,
            playerResult.player.name,
            playerResult.player.avatar,
            payload.message,
        );

        this.server.to(payload.roomId).emit(SocketEvent.CHAT_MESSAGE, msg);
    }

    // ===================== RESTART GAME =====================

    @SubscribeMessage(SocketEvent.GAME_RESTART)
    handleRestartGame(@ConnectedSocket() client: Socket) {
        const playerResult = this.roomService.getPlayerBySocketId(client.id);
        if (!playerResult) return;

        const { room, player } = playerResult;

        // Only allowed when game is over (status = finished or has no active gameState)
        if (room.status !== RoomStatus.FINISHED) return;

        // Register this player's vote
        if (!this.restartVotes.has(room.id)) {
            this.restartVotes.set(room.id, new Set());
        }
        const votes = this.restartVotes.get(room.id)!;
        votes.add(player.id);

        const totalPlayers = room.players.length;
        const voteCount = votes.size;

        // Broadcast current vote tally to everyone in the room
        this.server.to(room.id).emit(SocketEvent.GAME_RESTART_VOTE, {
            votes: voteCount,
            total: totalPlayers,
            voters: Array.from(votes),
        });

        // All players voted — execute restart
        if (voteCount >= totalPlayers) {
            this.restartVotes.delete(room.id);
            this.clearTurnTimer(room.id);

            if (this.actionTimers.has(room.id)) {
                clearTimeout(this.actionTimers.get(room.id));
                this.actionTimers.delete(room.id);
            }
            if (this.favorTimers.has(room.id)) {
                clearTimeout(this.favorTimers.get(room.id));
                this.favorTimers.delete(room.id);
            }
            if (this.deleteTimers.has(room.id)) {
                clearTimeout(this.deleteTimers.get(room.id));
                this.deleteTimers.delete(room.id);
            }

            room.status = RoomStatus.WAITING;
            room.gameState = null;
            room.players.forEach((p) => {
                p.hand = [];
                p.isAlive = true;
                p.isReady = false;
            });

            const sysMsg = this.chatService.sendSystemMessage(
                room.id,
                '🔄 Tất cả đồng ý! Trò chơi đã được reset — chờ bắt đầu ván mới...',
            );
            this.server.to(room.id).emit(SocketEvent.CHAT_MESSAGE, sysMsg);

            this.broadcastRoomUpdate(room);
            this.emitRoomListToLobby();
        } else {
            const sysMsg = this.chatService.sendSystemMessage(
                room.id,
                `🔄 ${player.name} muốn chơi lại (${voteCount}/${totalPlayers})`,
            );
            this.server.to(room.id).emit(SocketEvent.CHAT_MESSAGE, sysMsg);
        }
    }
}
