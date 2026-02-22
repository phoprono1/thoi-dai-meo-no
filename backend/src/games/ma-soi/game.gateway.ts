import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    ConnectedSocket,
    MessageBody,
    OnGatewayDisconnect,
    OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MaSoiRoomService } from './room.service.js';
import { MaSoiGameService } from './game.service.js';
import {
    MaSoiSocketEvent,
    GamePhase,
    PlayerStatus,
    RoleId,
    Team,
    GameConfig,
    MaSoiRoom,
    MaSoiPlayer,
} from './types.js';

const PHASE_AUTO_ADVANCE_DELAY = 6000; // ms after reveal/result before auto-advancing

@WebSocketGateway({
    cors: { origin: '*' },
    namespace: '/',
})
export class MaSoiGateway implements OnGatewayInit, OnGatewayDisconnect {
    @WebSocketServer() server!: Server;

    /** Lưu interval của bộ đếm thời gian mỗi phòng, tránh trường hợp nhiều interval chạy song song */
    private phaseTimers = new Map<string, NodeJS.Timeout>();

    constructor(
        private readonly roomService: MaSoiRoomService,
        private readonly gameService: MaSoiGameService,
    ) { }

    afterInit(): void {
        // Dọn phòng waiting đã tồn tại quá 30 phút, chạy mỗi 5 phút
        setInterval(() => {
            this.roomService.cleanupZombieRooms();
        }, 5 * 60 * 1000);
    }

    // ════════════════════════════════════════════
    // DISCONNECT
    // ════════════════════════════════════════════

    handleDisconnect(client: Socket): void {
        const mapping = this.roomService.getRoomBySocket(client.id);
        if (!mapping) return;

        const { room, player } = mapping;

        // If game in progress, keep player slot but mark disconnected
        if (room.status === 'playing' && room.gameState) {
            this.roomService.removeSocketMapping(client.id);
            const gsPlayer = room.gameState.players.find((p) => p.id === player.id);
            if (gsPlayer) {
                gsPlayer.socketId = '';
            }
            this.broadcastGameState(room.id);
        } else {
            // In lobby — leaveRoom handles socketMap cleanup internally
            const result = this.roomService.leaveRoom(client.id);
            if (result?.roomDestroyed) {
                // nothing left to broadcast
            } else if (result) {
                this.broadcastRoomUpdate(room.id);
            }
        }
    }

    // ════════════════════════════════════════════
    // ROOM MANAGEMENT
    // ════════════════════════════════════════════

    @SubscribeMessage(MaSoiSocketEvent.ROOM_LIST)
    handleRoomList(@ConnectedSocket() client: Socket) {
        client.emit(MaSoiSocketEvent.ROOM_LIST, this.roomService.getPublicRooms());
    }

    @SubscribeMessage(MaSoiSocketEvent.ROOM_CREATE)
    handleRoomCreate(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { name: string; password?: string; playerName: string; avatar?: string },
    ) {
        const result = this.roomService.createRoom({
            hostSocketId: client.id,
            roomName: data.name,
            password: data.password,
            playerName: data.playerName,
            avatar: data.avatar,
        });

        if ('error' in result) {
            return client.emit(MaSoiSocketEvent.ROOM_ERROR, result.error);
        }

        client.join(result.room.id);
        client.emit(MaSoiSocketEvent.ROOM_UPDATE, this.gameService.buildClientRoom(result.room));
    }

    @SubscribeMessage(MaSoiSocketEvent.ROOM_JOIN)
    handleRoomJoin(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string; password?: string; playerName: string; avatar?: string },
    ) {
        const result = this.roomService.joinRoom({
            socketId: client.id,
            roomId: data.roomId,
            password: data.password,
            playerName: data.playerName,
            avatar: data.avatar,
        });

        if ('error' in result) {
            return client.emit(MaSoiSocketEvent.ROOM_ERROR, result.error);
        }

        client.join(data.roomId);
        this.broadcastRoomUpdate(data.roomId);
    }

    @SubscribeMessage(MaSoiSocketEvent.PLAYER_RECONNECT)
    handleReconnect(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string; playerId: string },
    ) {
        const result = this.roomService.reconnect(client.id, data.roomId, data.playerId);
        if ('error' in result) {
            return client.emit(MaSoiSocketEvent.ROOM_ERROR, result.error);
        }

        client.join(data.roomId);
        const room = this.roomService.getRoom(data.roomId);
        if (!room) return;

        if (room.status === 'playing' && room.gameState) {
            client.emit(
                MaSoiSocketEvent.GAME_STATE,
                this.gameService.buildClientState(room, data.playerId),
            );
        } else {
            client.emit(MaSoiSocketEvent.ROOM_UPDATE, this.gameService.buildClientRoom(room));
        }
    }

    @SubscribeMessage(MaSoiSocketEvent.ROOM_LEAVE)
    handleLeave(@ConnectedSocket() client: Socket) {
        const mapping = this.roomService.getRoomBySocket(client.id);
        if (!mapping) return;

        const result = this.roomService.leaveRoom(client.id);
        if (!result) return;

        client.leave(mapping.room.id);
        if (!result.roomDestroyed) {
            this.broadcastRoomUpdate(mapping.room.id);
        }
    }

    @SubscribeMessage(MaSoiSocketEvent.ROOM_KICK)
    handleKick(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { targetId: string },
    ) {
        const mapping = this.roomService.getRoomBySocket(client.id);
        if (!mapping) return;

        const result = this.roomService.kickPlayer(client.id, data.targetId);
        if ('error' in result) {
            return client.emit(MaSoiSocketEvent.ROOM_ERROR, result.error);
        }

        // Notify kicked player — remove from room then send kick event
        this.server.in(result.kickedSocketId).socketsLeave(result.room.id);
        this.server.to(result.kickedSocketId).emit(MaSoiSocketEvent.ROOM_KICK, { reason: 'Bạn đã bị kick khỏi phòng.' });

        this.broadcastRoomUpdate(mapping.room.id);
    }

    // ════════════════════════════════════════════
    // CONFIG & READY
    // ════════════════════════════════════════════

    @SubscribeMessage(MaSoiSocketEvent.GAME_CONFIG_UPDATE)
    handleConfigUpdate(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: Partial<GameConfig>,
    ) {
        const mapping = this.roomService.getRoomBySocket(client.id);
        if (!mapping) return;

        const result = this.roomService.updateConfig(client.id, data);
        if ('error' in result) {
            return client.emit(MaSoiSocketEvent.ROOM_ERROR, result.error);
        }

        this.broadcastRoomUpdate(mapping.room.id);
    }

    // ════════════════════════════════════════════
    // GAME START
    // ════════════════════════════════════════════

    @SubscribeMessage(MaSoiSocketEvent.GAME_START)
    handleGameStart(@ConnectedSocket() client: Socket) {
        const mapping = this.roomService.getRoomBySocket(client.id);
        if (!mapping) return;
        const { room } = mapping;

        const canStart = this.roomService.canStartGame(client.id);
        if ('error' in canStart) {
            return client.emit(MaSoiSocketEvent.ROOM_ERROR, canStart.error);
        }

        const gs = this.gameService.initializeGame(room);

        // Send each player their personalized game state
        this.sendPersonalizedStates(room.id);

        // Emit the first night phase start
        this.server.to(room.id).emit(MaSoiSocketEvent.GAME_PHASE_CHANGE, { phase: gs.phase });

        // Schedule first night phase
        this.schedulePhaseTimer(room.id, gs.phaseDeadline);
    }

    // ════════════════════════════════════════════
    // NIGHT ACTIONS
    // ════════════════════════════════════════════

    @SubscribeMessage(MaSoiSocketEvent.NIGHT_ACTION)
    handleNightAction(
        @ConnectedSocket() client: Socket,
        @MessageBody()
        data: {
            phase: GamePhase;
            targetId?: string;
            targetIds?: string[];
            usePotion?: 'save' | 'kill' | 'none';
            question?: string;
        },
    ) {
        const mapping = this.roomService.getRoomBySocket(client.id);
        if (!mapping) return;
        const { room, player } = mapping;
        if (!room.gameState) return;

        const result = this.gameService.submitNightAction(
            room,
            player.id,
            data.phase,
            data,
        );

        if ('error' in result) {
            return client.emit(MaSoiSocketEvent.ROOM_ERROR, result.error);
        }

        // Send seer result immediately to the seer
        if (data.phase === GamePhase.NIGHT_SEER && room.gameState.nightActions.seerTarget) {
            const seerTarget = room.gameState.players.find(
                (p) => p.id === room.gameState!.nightActions.seerTarget,
            );
            if (seerTarget) {
                client.emit(MaSoiSocketEvent.SEER_RESULT, {
                    targetId: seerTarget.id,
                    team: seerTarget.team,
                    role: seerTarget.role,
                });
            }
        }

        // Fox result
        if (data.phase === GamePhase.NIGHT_FOX && room.gameState.nightActions.foxTargets) {
            const hasWolf = room.gameState.nightActions.foxTargets.some((id) => {
                const p = room.gameState!.players.find((x) => x.id === id);
                return p && this.gameService.isWolf(p);
            });
            client.emit(MaSoiSocketEvent.FOX_RESULT, { hasWolf });
        }

        // Try auto-advance the phase (if all expected have submitted)
        this.tryAdvanceNightPhase(room.id, data.phase);
    }

    // ════════════════════════════════════════════
    // VOTING
    // ════════════════════════════════════════════

    @SubscribeMessage(MaSoiSocketEvent.DAY_VOTE)
    handleVote(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { targetId: string },
    ) {
        const mapping = this.roomService.getRoomBySocket(client.id);
        if (!mapping) return;
        const { room, player } = mapping;
        if (!room.gameState) return;

        const result = this.gameService.castVote(room, player.id, data.targetId);
        if ('error' in result) {
            return client.emit(MaSoiSocketEvent.ROOM_ERROR, result.error);
        }

        this.server.to(room.id).emit(MaSoiSocketEvent.VOTE_UPDATE, {
            votes: room.gameState.votes,
        });
    }

    @SubscribeMessage(MaSoiSocketEvent.DAY_UNVOTE)
    handleUnvote(@ConnectedSocket() client: Socket) {
        const mapping = this.roomService.getRoomBySocket(client.id);
        if (!mapping) return;
        const { room, player } = mapping;
        if (!room.gameState) return;

        this.gameService.castVote(room, player.id, null);
        this.server.to(room.id).emit(MaSoiSocketEvent.VOTE_UPDATE, {
            votes: room.gameState.votes,
        });
    }

    // ════════════════════════════════════════════
    // HUNTER SHOT
    // ════════════════════════════════════════════

    @SubscribeMessage(MaSoiSocketEvent.HUNTER_SHOOT)
    handleHunterShoot(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { targetId: string },
    ) {
        const mapping = this.roomService.getRoomBySocket(client.id);
        if (!mapping) return;
        const { room, player } = mapping;
        if (!room.gameState) return;

        const result = this.gameService.hunterShoot(room, player.id, data.targetId);
        if ('error' in result) {
            return client.emit(MaSoiSocketEvent.ROOM_ERROR, result.error);
        }

        this.server.to(room.id).emit(MaSoiSocketEvent.PLAYER_DIED, {
            playerId: result.target.id,
            name: result.target.name,
            role: result.target.role,
            byHunter: true,
        });

        this.checkWinAndContinue(room.id);
    }

    // ════════════════════════════════════════════
    // CHAT
    // ════════════════════════════════════════════

    @SubscribeMessage(MaSoiSocketEvent.CHAT_SEND)
    handleChat(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { message: string },
    ) {
        const mapping = this.roomService.getRoomBySocket(client.id);
        if (!mapping) return;
        const { room, player } = mapping;

        // Alive-only day chat
        if (player.status !== PlayerStatus.ALIVE) return;

        this.server.to(room.id).emit(MaSoiSocketEvent.CHAT_MESSAGE, {
            playerId: player.id,
            name: player.name,
            avatar: player.avatar,
            message: data.message.slice(0, 300),
            timestamp: Date.now(),
        });
    }

    @SubscribeMessage(MaSoiSocketEvent.WOLF_CHAT_SEND)
    handleWolfChat(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { message: string },
    ) {
        const mapping = this.roomService.getRoomBySocket(client.id);
        if (!mapping) return;
        const { room, player } = mapping;
        if (!room.gameState) return;
        if (!this.gameService.isWolf(player)) return;

        // Only during night phases
        const phase = room.gameState.phase;
        if (!phase.startsWith('night_')) return;

        // Send only to other wolves
        room.gameState.players
            .filter((p) => this.gameService.isWolf(p) && p.socketId && p.socketId !== client.id)
            .forEach((p) => {
                this.server.to(p.socketId).emit(MaSoiSocketEvent.WOLF_CHAT_MESSAGE, {
                    playerId: player.id,
                    name: player.name,
                    message: data.message.slice(0, 300),
                    timestamp: Date.now(),
                });
            });
        // Echo back to sender
        client.emit(MaSoiSocketEvent.WOLF_CHAT_MESSAGE, {
            playerId: player.id,
            name: player.name,
            message: data.message.slice(0, 300),
            timestamp: Date.now(),
        });
    }

    @SubscribeMessage(MaSoiSocketEvent.DEAD_CHAT_SEND)
    handleDeadChat(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { message: string },
    ) {
        const mapping = this.roomService.getRoomBySocket(client.id);
        if (!mapping) return;
        const { room, player } = mapping;
        if (!room.gameState || player.status !== PlayerStatus.DEAD) return;

        room.gameState.players
            .filter((p) => p.status === PlayerStatus.DEAD && p.socketId)
            .forEach((p) => {
                this.server.to(p.socketId).emit(MaSoiSocketEvent.DEAD_CHAT_MESSAGE, {
                    playerId: player.id,
                    name: player.name,
                    message: data.message.slice(0, 300),
                    timestamp: Date.now(),
                });
            });
    }

    // ════════════════════════════════════════════
    // INTERNAL HELPERS
    // ════════════════════════════════════════════

    private broadcastRoomUpdate(roomId: string): void {
        const room = this.roomService.getRoom(roomId);
        if (!room) return;
        this.server.to(roomId).emit(MaSoiSocketEvent.ROOM_UPDATE, this.gameService.buildClientRoom(room));
    }

    private broadcastGameState(roomId: string): void {
        const room = this.roomService.getRoom(roomId);
        if (!room || !room.gameState) return;
        room.gameState.players.forEach((p) => {
            if (!p.socketId) return;
            this.server.to(p.socketId).emit(
                MaSoiSocketEvent.GAME_STATE,
                this.gameService.buildClientState(room, p.id),
            );
        });
    }

    private sendPersonalizedStates(roomId: string): void {
        this.broadcastGameState(roomId);
    }

    private schedulePhaseTimer(roomId: string, deadline: number): void {
        // Huỷ timer cũ nếu còn tồn tại
        const old = this.phaseTimers.get(roomId);
        if (old) {
            clearInterval(old);
            this.phaseTimers.delete(roomId);
        }

        const remaining = Math.max(0, deadline - Date.now());
        let elapsed = 0;
        const interval = setInterval(() => {
            elapsed += 1000;
            const left = Math.max(0, Math.ceil((remaining - elapsed) / 1000));
            this.server.to(roomId).emit(MaSoiSocketEvent.PHASE_TIMER, { secondsLeft: left });
            if (elapsed >= remaining) {
                clearInterval(interval);
                this.phaseTimers.delete(roomId);
                this.onPhaseTimeout(roomId);
            }
        }, 1000);
        this.phaseTimers.set(roomId, interval);
    }

    private onPhaseTimeout(roomId: string): void {
        const room = this.roomService.getRoom(roomId);
        if (!room || !room.gameState) return;
        const gs = room.gameState;

        switch (gs.phase) {
            case GamePhase.NIGHT_START:
                this.gameService.startNight(room);
                this.sendPersonalizedStates(roomId);
                this.server.to(roomId).emit(MaSoiSocketEvent.GAME_PHASE_CHANGE, { phase: gs.phase });
                this.schedulePhaseTimer(roomId, gs.phaseDeadline);
                break;

            case GamePhase.NIGHT_CUPID:
            case GamePhase.NIGHT_WILD_CHILD:
            case GamePhase.NIGHT_WOLF:
            case GamePhase.NIGHT_ALPHA:
            case GamePhase.NIGHT_SEER:
            case GamePhase.NIGHT_DOCTOR:
            case GamePhase.NIGHT_BODYGUARD:
            case GamePhase.NIGHT_WITCH:
            case GamePhase.NIGHT_FOX:
            case GamePhase.NIGHT_SERIAL_KILLER:
            case GamePhase.NIGHT_WHITE_WOLF:
            case GamePhase.NIGHT_MEDIUM: {
                const next = this.gameService.advanceNightPhase(room, gs.phase);
                this.handlePostPhaseChange(roomId, next);
                break;
            }

            case GamePhase.DAY_REVEAL:
                this.gameService.startDiscussion(room);
                this.broadcastPhaseChange(roomId);
                this.schedulePhaseTimer(roomId, gs.phaseDeadline);
                break;

            case GamePhase.DAY_DISCUSSION:
                this.gameService.startVoting(room);
                this.broadcastPhaseChange(roomId);
                this.schedulePhaseTimer(roomId, gs.phaseDeadline);
                break;

            case GamePhase.DAY_VOTE:
                this.resolveVoteAndContinue(roomId);
                break;

            case GamePhase.DAY_VOTE_RESULT:
            case GamePhase.HUNTER_SHOT:
                this.checkWinAndContinue(roomId);
                break;
        }
    }

    private handlePostPhaseChange(roomId: string, phase: GamePhase): void {
        const room = this.roomService.getRoom(roomId);
        if (!room || !room.gameState) return;
        const gs = room.gameState;

        if (phase === GamePhase.DAY_REVEAL) {
            // Broadcast death announcements
            gs.nightDeaths.forEach((id) => {
                const p = gs.players.find((x) => x.id === id);
                if (p) {
                    this.server.to(roomId).emit(MaSoiSocketEvent.PLAYER_DIED, {
                        playerId: id,
                        name: p.name,
                        role: room.config.revealRoleOnDeath ? p.role : undefined,
                    });
                }
            });
            this.sendPersonalizedStates(roomId);
            this.broadcastPhaseChange(roomId);
            this.schedulePhaseTimer(roomId, gs.phaseDeadline);

            // Check win after night deaths
            const winCheck = this.gameService.checkWin(room);
            if (winCheck.winner !== null) {
                this.broadcastGameOver(roomId);
            }
        } else {
            this.sendPersonalizedStates(roomId);
            this.broadcastPhaseChange(roomId);
            this.schedulePhaseTimer(roomId, gs.phaseDeadline);
        }
    }

    private resolveVoteAndContinue(roomId: string): void {
        const room = this.roomService.getRoom(roomId);
        if (!room || !room.gameState) return;
        const gs = room.gameState;

        const { eliminated, tie, hunterTriggered } = this.gameService.resolveVoting(room);

        if (eliminated) {
            this.server.to(roomId).emit(MaSoiSocketEvent.PLAYER_DIED, {
                playerId: eliminated.id,
                name: eliminated.name,
                role: eliminated.role,
            });
        }

        this.sendPersonalizedStates(roomId);
        this.broadcastPhaseChange(roomId);

        // Game over from jester?
        if (gs.phase === GamePhase.GAME_OVER) {
            this.broadcastGameOver(roomId);
            return;
        }

        if (hunterTriggered && eliminated) {
            // Switch to hunter shot phase
            gs.phase = GamePhase.HUNTER_SHOT;
            gs.phaseDeadline = Date.now() + 20000;
            this.broadcastPhaseChange(roomId);
            this.schedulePhaseTimer(roomId, gs.phaseDeadline);
            return;
        }

        setTimeout(() => this.checkWinAndContinue(roomId), PHASE_AUTO_ADVANCE_DELAY);
    }

    private checkWinAndContinue(roomId: string): void {
        const room = this.roomService.getRoom(roomId);
        if (!room || !room.gameState) return;
        const gs = room.gameState;

        const { winner } = this.gameService.checkWin(room);
        if (winner !== null) {
            this.broadcastGameOver(roomId);
            return;
        }

        // Proceed to next night
        gs.round++;
        gs.phase = GamePhase.NIGHT_START;
        gs.phaseDeadline = Date.now() + 4000;
        this.broadcastPhaseChange(roomId);
        this.sendPersonalizedStates(roomId);
        this.schedulePhaseTimer(roomId, gs.phaseDeadline);
    }

    private broadcastPhaseChange(roomId: string): void {
        const room = this.roomService.getRoom(roomId);
        if (!room || !room.gameState) return;
        this.server.to(roomId).emit(MaSoiSocketEvent.GAME_PHASE_CHANGE, {
            phase: room.gameState.phase,
            deadline: room.gameState.phaseDeadline,
        });
    }

    private broadcastGameOver(roomId: string): void {
        const room = this.roomService.getRoom(roomId);
        if (!room || !room.gameState) return;
        const gs = room.gameState;

        // Xoá timer phase khi game kết thúc
        const timer = this.phaseTimers.get(roomId);
        if (timer) {
            clearInterval(timer);
            this.phaseTimers.delete(roomId);
        }

        this.server.to(roomId).emit(MaSoiSocketEvent.GAME_OVER, {
            winner: gs.winner,
            winnerIds: gs.winnerIds,
            players: gs.players.map((p) => ({
                id: p.id,
                name: p.name,
                avatar: p.avatar,
                role: p.role,
                team: p.team,
                status: p.status,
            })),
            log: gs.log,
        });

        // Reset room after delay
        setTimeout(() => {
            const r = this.roomService.getRoom(roomId);
            if (r) {
                r.status = 'waiting';
                r.gameState = null;
                r.players.forEach((p) => { p.isReady = false; });
                this.broadcastRoomUpdate(roomId);
            }
        }, 15000);
    }

    /** Auto-advance a night phase if all required players have submitted */
    private tryAdvanceNightPhase(roomId: string, phase: GamePhase): void {
        const room = this.roomService.getRoom(roomId);
        if (!room || !room.gameState) return;
        const gs = room.gameState;
        if (gs.phase !== phase) return;

        const requiredActors = this.getRequiredActors(room, phase);
        const submitted = gs.nightActions.submittedBy;
        const allDone = requiredActors.every((id) => submitted.has(id));

        if (allDone && requiredActors.length > 0) {
            const next = this.gameService.advanceNightPhase(room, phase);
            this.handlePostPhaseChange(roomId, next);
        }
    }

    /** Returns the player IDs expected to submit for a given night phase */
    private getRequiredActors(
        room: MaSoiRoom,
        phase: GamePhase,
    ): string[] {
        const gs = room.gameState;
        if (!gs) return [];
        const alive = gs.players.filter((p: MaSoiPlayer) => p.status === PlayerStatus.ALIVE);

        const findAlive = (role: RoleId) =>
            alive.filter((p) => p.role === role).map((p) => p.id);

        switch (phase) {
            case GamePhase.NIGHT_CUPID: return findAlive(RoleId.CUPID);
            case GamePhase.NIGHT_WILD_CHILD: return findAlive(RoleId.WILD_CHILD);
            case GamePhase.NIGHT_WOLF:
                return alive.filter((p) => this.gameService.isWolf(p)).map((p) => p.id);
            case GamePhase.NIGHT_ALPHA: return findAlive(RoleId.ALPHA_WOLF);
            case GamePhase.NIGHT_SEER:
                return [
                    ...findAlive(RoleId.SEER),
                    ...findAlive(RoleId.LITTLE_RED),
                ].slice(0, 1); // only 1 seer per game
            case GamePhase.NIGHT_DOCTOR: return findAlive(RoleId.DOCTOR);
            case GamePhase.NIGHT_BODYGUARD: return findAlive(RoleId.BODYGUARD);
            case GamePhase.NIGHT_WITCH: return findAlive(RoleId.WITCH);
            case GamePhase.NIGHT_FOX: return alive.filter((p) => p.role === RoleId.FOX && p.foxActive).map((p) => p.id);
            case GamePhase.NIGHT_SERIAL_KILLER: return findAlive(RoleId.SERIAL_KILLER);
            case GamePhase.NIGHT_WHITE_WOLF: return findAlive(RoleId.WHITE_WOLF);
            case GamePhase.NIGHT_MEDIUM: return findAlive(RoleId.MEDIUM);
            default: return [];
        }
    }


}
