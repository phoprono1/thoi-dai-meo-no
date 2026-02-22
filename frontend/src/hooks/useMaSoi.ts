'use client';

import { useEffect, useCallback, useReducer } from 'react';
import { getSocket } from '@/lib/socket';
import {
    MaSoiSocketEvent,
    ClientMaSoiGameState,
    ClientMaSoiPlayer,
    ClientMaSoiRoom,
    GameConfig,
    GamePhase,
    ChatMessage,
    DayVote,
    Team,
} from '@/lib/maSoiData';

// Re-export for convenience
export type { ClientMaSoiGameState, ClientMaSoiRoom, ChatMessage };

// ─────────────────────────────────────────────
// STATE SHAPE
// ─────────────────────────────────────────────

export type MaSoiView = 'lobby' | 'waiting_room' | 'game' | 'game_over';

export interface MaSoiState {
    view: MaSoiView;

    // My identity
    playerId: string | null;
    playerName: string;
    playerAvatar: string;

    // Room state (lobby + waiting room)
    room: ClientMaSoiRoom | null;
    roomList: ClientMaSoiRoom[];

    // Game state
    game: ClientMaSoiGameState | null;

    // Timer
    secondsLeft: number;

    // Chat
    chatMessages: ChatMessage[];
    wolfChatMessages: ChatMessage[];
    deadChatMessages: ChatMessage[];

    // Seer / fox / detective accumulated results
    seerHistory: { round: number; targetId: string; isWolf: boolean }[];
    foxHistory: { round: number; hasWolf: boolean }[];

    // Error / notifications
    error: string | null;
    notification: string | null;
}

// ─────────────────────────────────────────────
// ACTIONS
// ─────────────────────────────────────────────

type Action =
    | { type: 'SET_VIEW'; payload: MaSoiView }
    | { type: 'SET_PLAYER'; payload: { id: string; name: string; avatar: string } }
    | { type: 'SET_PLAYER_NAME'; payload: string }
    | { type: 'SET_PLAYER_AVATAR'; payload: string }
    | { type: 'SET_ROOM'; payload: ClientMaSoiRoom }
    | { type: 'CLEAR_ROOM' }
    | { type: 'SET_ROOM_LIST'; payload: ClientMaSoiRoom[] }
    | { type: 'SET_GAME'; payload: ClientMaSoiGameState }
    | { type: 'SET_TIMER'; payload: number }
    | { type: 'PUSH_CHAT'; payload: ChatMessage }
    | { type: 'PUSH_WOLF_CHAT'; payload: ChatMessage }
    | { type: 'PUSH_DEAD_CHAT'; payload: ChatMessage }
    | { type: 'PUSH_SEER_RESULT'; payload: { round: number; targetId: string; isWolf: boolean } }
    | { type: 'PUSH_FOX_RESULT'; payload: { round: number; hasWolf: boolean } }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_NOTIFICATION'; payload: string | null }
    | { type: 'PATCH_GAME_PHASE'; payload: { phase: GamePhase; deadline?: number } }
    | { type: 'PATCH_GAME_VOTES'; payload: DayVote[] }
    | { type: 'PATCH_GAME_OVER'; payload: { winner: string; winnerIds: string[]; players: ClientMaSoiPlayer[] } };

function reducer(state: MaSoiState, action: Action): MaSoiState {
    switch (action.type) {
        case 'SET_VIEW': return { ...state, view: action.payload };
        case 'SET_PLAYER': return { ...state, playerId: action.payload.id, playerName: action.payload.name, playerAvatar: action.payload.avatar };
        case 'SET_PLAYER_NAME': return { ...state, playerName: action.payload };
        case 'SET_PLAYER_AVATAR': return { ...state, playerAvatar: action.payload };
        case 'SET_ROOM': return { ...state, room: action.payload };
        case 'CLEAR_ROOM': return { ...state, room: null, game: null, view: 'lobby', chatMessages: [], wolfChatMessages: [], deadChatMessages: [], seerHistory: [], foxHistory: [] };
        case 'SET_ROOM_LIST': return { ...state, roomList: action.payload };
        case 'SET_GAME': return {
            ...state,
            game: action.payload,
            // Reset seer/fox history when a brand-new game starts
            seerHistory: (!state.game || action.payload.round < state.game.round) ? [] : state.seerHistory,
            foxHistory: (!state.game || action.payload.round < state.game.round) ? [] : state.foxHistory,
        };
        case 'SET_TIMER': return { ...state, secondsLeft: action.payload };
        case 'PUSH_CHAT':
            return { ...state, chatMessages: [...state.chatMessages.slice(-99), action.payload] };
        case 'PUSH_WOLF_CHAT':
            return { ...state, wolfChatMessages: [...state.wolfChatMessages.slice(-99), action.payload] };
        case 'PUSH_DEAD_CHAT':
            return { ...state, deadChatMessages: [...state.deadChatMessages.slice(-99), action.payload] };
        case 'PUSH_SEER_RESULT': {
            // Deduplicate: same round + same target should only be recorded once
            const already = state.seerHistory.some(
                (h) => h.round === action.payload.round && h.targetId === action.payload.targetId,
            );
            if (already) return state;
            return { ...state, seerHistory: [...state.seerHistory, action.payload] };
        }
        case 'PUSH_FOX_RESULT':
            return { ...state, foxHistory: [...state.foxHistory, action.payload] };
        case 'SET_ERROR': return { ...state, error: action.payload };
        case 'SET_NOTIFICATION': return { ...state, notification: action.payload };
        case 'PATCH_GAME_PHASE':
            if (!state.game) return state;
            return {
                ...state,
                game: {
                    ...state.game,
                    phase: action.payload.phase,
                    phaseDeadline: action.payload.deadline ?? state.game.phaseDeadline,
                },
                view: action.payload.phase === GamePhase.GAME_OVER ? 'game_over' : state.view,
            };
        case 'PATCH_GAME_VOTES':
            if (!state.game) return state;
            return { ...state, game: { ...state.game, votes: action.payload } };
        case 'PATCH_GAME_OVER':
            if (!state.game) return state;
            return {
                ...state,
                view: 'game_over',
                game: {
                    ...state.game,
                    winner: action.payload.winner as Team,
                    winnerIds: action.payload.winnerIds,
                    players: action.payload.players,
                },
            };
        default: return state;
    }
}

const INITIAL_STATE: MaSoiState = {
    view: 'lobby',
    playerId: null,
    playerName: '',
    playerAvatar: '/assets/ma-soi/ui/avatars/avatar-1.png',
    room: null,
    roomList: [],
    game: null,
    secondsLeft: 0,
    chatMessages: [],
    wolfChatMessages: [],
    deadChatMessages: [],
    seerHistory: [],
    foxHistory: [],
    error: null,
    notification: null,
};

// ─────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────

export function useMaSoi() {
    const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

    // ── Socket connection ────────────────────
    useEffect(() => {
        const socket = getSocket();

        // Room events
        socket.on(MaSoiSocketEvent.ROOM_LIST, (rooms: ClientMaSoiRoom[]) => {
            dispatch({ type: 'SET_ROOM_LIST', payload: rooms });
        });

        socket.on(MaSoiSocketEvent.ROOM_UPDATE, (room: ClientMaSoiRoom) => {
            dispatch({ type: 'SET_ROOM', payload: room });

            // Determine view
            if (room.status === 'waiting') {
                dispatch({ type: 'SET_VIEW', payload: 'waiting_room' });
            }
        });

        socket.on(MaSoiSocketEvent.ROOM_ERROR, (msg: string) => {
            dispatch({ type: 'SET_ERROR', payload: msg });
            // Auto-clear after 4s
            setTimeout(() => dispatch({ type: 'SET_ERROR', payload: null }), 4000);
        });

        socket.on(MaSoiSocketEvent.ROOM_KICK, () => {
            dispatch({ type: 'CLEAR_ROOM' });
            dispatch({ type: 'SET_NOTIFICATION', payload: 'Bạn đã bị kick khỏi phòng.' });
        });

        // Game events
        socket.on(MaSoiSocketEvent.GAME_STATE, (gs: ClientMaSoiGameState) => {
            dispatch({ type: 'SET_GAME', payload: gs });
            dispatch({ type: 'SET_VIEW', payload: gs.phase === GamePhase.GAME_OVER ? 'game_over' : 'game' });

            // Accumulate seer result if present
            if (gs.seerResult) {
                dispatch({
                    type: 'PUSH_SEER_RESULT',
                    payload: {
                        round: gs.round,
                        targetId: gs.seerResult.targetId,
                        isWolf: gs.seerResult.team === 'werewolf',
                    },
                });
            }
        });

        socket.on(MaSoiSocketEvent.GAME_PHASE_CHANGE, (data: { phase: GamePhase; deadline?: number }) => {
            dispatch({ type: 'PATCH_GAME_PHASE', payload: data });
        });

        socket.on(MaSoiSocketEvent.PHASE_TIMER, (data: { secondsLeft: number }) => {
            dispatch({ type: 'SET_TIMER', payload: data.secondsLeft });
        });

        socket.on(MaSoiSocketEvent.VOTE_UPDATE, (data: { votes: DayVote[] }) => {
            dispatch({ type: 'PATCH_GAME_VOTES', payload: data.votes });
        });

        socket.on(MaSoiSocketEvent.GAME_OVER, (data: { winner: string; winnerIds: string[]; players: ClientMaSoiPlayer[] }) => {
            dispatch({ type: 'PATCH_GAME_OVER', payload: data });
        });

        // Seer / fox / detective personal results
        socket.on(MaSoiSocketEvent.SEER_RESULT, (data: { targetId: string; team: string; role: string }) => {
            // Already handled via GAME_STATE, but also direct push for immediate feedback
            dispatch({
                type: 'PUSH_SEER_RESULT',
                payload: { round: -1, targetId: data.targetId, isWolf: data.team === 'werewolf' },
            });
        });

        socket.on(MaSoiSocketEvent.FOX_RESULT, (data: { hasWolf: boolean }) => {
            dispatch({ type: 'PUSH_FOX_RESULT', payload: { round: -1, hasWolf: data.hasWolf } });
        });

        // Chat
        socket.on(MaSoiSocketEvent.CHAT_MESSAGE, (msg: ChatMessage) => {
            dispatch({ type: 'PUSH_CHAT', payload: { ...msg, channel: 'public' } });
        });

        socket.on(MaSoiSocketEvent.WOLF_CHAT_MESSAGE, (msg: ChatMessage) => {
            dispatch({ type: 'PUSH_WOLF_CHAT', payload: { ...msg, channel: 'wolf' } });
        });

        socket.on(MaSoiSocketEvent.DEAD_CHAT_MESSAGE, (msg: ChatMessage) => {
            dispatch({ type: 'PUSH_DEAD_CHAT', payload: { ...msg, channel: 'dead' } });
        });

        return () => {
            socket.off(MaSoiSocketEvent.ROOM_LIST);
            socket.off(MaSoiSocketEvent.ROOM_UPDATE);
            socket.off(MaSoiSocketEvent.ROOM_ERROR);
            socket.off(MaSoiSocketEvent.ROOM_KICK);
            socket.off(MaSoiSocketEvent.GAME_STATE);
            socket.off(MaSoiSocketEvent.GAME_PHASE_CHANGE);
            socket.off(MaSoiSocketEvent.PHASE_TIMER);
            socket.off(MaSoiSocketEvent.VOTE_UPDATE);
            socket.off(MaSoiSocketEvent.GAME_OVER);
            socket.off(MaSoiSocketEvent.SEER_RESULT);
            socket.off(MaSoiSocketEvent.FOX_RESULT);
            socket.off(MaSoiSocketEvent.CHAT_MESSAGE);
            socket.off(MaSoiSocketEvent.WOLF_CHAT_MESSAGE);
            socket.off(MaSoiSocketEvent.DEAD_CHAT_MESSAGE);
        };
    }, []);

    // ── Actions ──────────────────────────────

    const fetchRooms = useCallback(() => {
        getSocket().emit(MaSoiSocketEvent.ROOM_LIST);
    }, []);

    const createRoom = useCallback((roomName: string, password?: string, maxPlayers = 10) => {
        dispatch({ type: 'SET_ERROR', payload: null });
        getSocket().emit(MaSoiSocketEvent.ROOM_CREATE, {
            name: roomName,
            password,
            maxPlayers,
            playerName: state.playerName || 'Ẩn Danh',
            avatar: state.playerAvatar,
        });
        // Server will respond with ROOM_UPDATE; extract playerId from room.players
        const socket = getSocket();
        const handleUpdate = (room: ClientMaSoiRoom) => {
            const me = room.players.find((p) => p.isHost);
            if (me) dispatch({ type: 'SET_PLAYER', payload: { id: me.id, name: me.name, avatar: me.avatar } });
            socket.off(MaSoiSocketEvent.ROOM_UPDATE, handleUpdate);
        };
        socket.once(MaSoiSocketEvent.ROOM_UPDATE, handleUpdate);
    }, [state.playerName, state.playerAvatar]);

    const joinRoom = useCallback((roomId: string, password?: string) => {
        dispatch({ type: 'SET_ERROR', payload: null });
        getSocket().emit(MaSoiSocketEvent.ROOM_JOIN, {
            roomId,
            password,
            playerName: state.playerName || 'Ẩn Danh',
            avatar: state.playerAvatar,
        });
        const socket = getSocket();
        const handleUpdate = (room: ClientMaSoiRoom) => {
            const me = room.players.find((p) => !p.isHost && p.name === (state.playerName || 'Ẩn Danh'));
            if (me) dispatch({ type: 'SET_PLAYER', payload: { id: me.id, name: me.name, avatar: me.avatar } });
            socket.off(MaSoiSocketEvent.ROOM_UPDATE, handleUpdate);
        };
        socket.once(MaSoiSocketEvent.ROOM_UPDATE, handleUpdate);
    }, [state.playerName, state.playerAvatar]);

    const leaveRoom = useCallback(() => {
        getSocket().emit(MaSoiSocketEvent.ROOM_LEAVE);
        dispatch({ type: 'CLEAR_ROOM' });
    }, []);

    const kickPlayer = useCallback((targetId: string) => {
        getSocket().emit(MaSoiSocketEvent.ROOM_KICK, { targetId });
    }, []);

    const updateConfig = useCallback((patch: Partial<GameConfig>) => {
        getSocket().emit(MaSoiSocketEvent.GAME_CONFIG_UPDATE, patch);
    }, []);

    const startGame = useCallback(() => {
        getSocket().emit(MaSoiSocketEvent.GAME_START);
    }, []);

    const submitNightAction = useCallback((
        phase: GamePhase,
        payload: {
            targetId?: string;
            targetIds?: string[];
            usePotion?: 'save' | 'kill' | 'none';
            question?: string;
        },
    ) => {
        getSocket().emit(MaSoiSocketEvent.NIGHT_ACTION, { phase, ...payload });
    }, []);

    const castVote = useCallback((targetId: string) => {
        getSocket().emit(MaSoiSocketEvent.DAY_VOTE, { targetId });
    }, []);

    const unVote = useCallback(() => {
        getSocket().emit(MaSoiSocketEvent.DAY_UNVOTE);
    }, []);

    const hunterShoot = useCallback((targetId: string) => {
        getSocket().emit(MaSoiSocketEvent.HUNTER_SHOOT, { targetId });
    }, []);

    const sendChat = useCallback((message: string) => {
        getSocket().emit(MaSoiSocketEvent.CHAT_SEND, { message });
    }, []);

    const sendWolfChat = useCallback((message: string) => {
        getSocket().emit(MaSoiSocketEvent.WOLF_CHAT_SEND, { message });
    }, []);

    const sendDeadChat = useCallback((message: string) => {
        getSocket().emit(MaSoiSocketEvent.DEAD_CHAT_SEND, { message });
    }, []);

    const setPlayerName = useCallback((name: string) => {
        dispatch({ type: 'SET_PLAYER_NAME', payload: name });
    }, []);

    const setPlayerAvatar = useCallback((avatar: string) => {
        dispatch({ type: 'SET_PLAYER_AVATAR', payload: avatar });
    }, []);

    const dismissError = useCallback(() => {
        dispatch({ type: 'SET_ERROR', payload: null });
    }, []);

    const dismissNotification = useCallback(() => {
        dispatch({ type: 'SET_NOTIFICATION', payload: null });
    }, []);

    return {
        ...state,
        // Actions
        fetchRooms,
        createRoom,
        joinRoom,
        leaveRoom,
        kickPlayer,
        updateConfig,
        startGame,
        submitNightAction,
        castVote,
        unVote,
        hunterShoot,
        sendChat,
        sendWolfChat,
        sendDeadChat,
        setPlayerName,
        setPlayerAvatar,
        dismissError,
        dismissNotification,
    };
}
