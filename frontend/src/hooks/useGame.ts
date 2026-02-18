'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { getSocket } from '@/lib/socket';
import {
    SocketEvent,
    ClientRoom,
    ClientGameState,
    ChatMessage,
    Card,
} from '@/lib/types';
import type { Socket } from 'socket.io-client';
import { useSound } from '@/contexts/SoundContext';

const PLAYER_ID_KEY = 'meo_no_player_id';

export function useGame() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [rooms, setRooms] = useState<ClientRoom[]>([]);
    const [currentRoom, setCurrentRoom] = useState<ClientRoom | null>(null);
    const [playerId, setPlayerId] = useState<string | null>(null);
    const [gameState, setGameState] = useState<ClientGameState | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [actionLog, setActionLog] = useState<string[]>([]);
    const [futureCards, setFutureCards] = useState<Card[] | null>(null);
    const [pickCards, setPickCards] = useState<{ cards: Card[]; source: string } | null>(null);
    const [gameOver, setGameOver] = useState<any>(null);
    const [isSpectating, setIsSpectating] = useState<boolean>(false);
    const [eliminated, setEliminated] = useState<string | null>(null);
    const [turnTimeRemaining, setTurnTimeRemaining] = useState<number>(30);
    const [lastPlayedCards, setLastPlayedCards] = useState<string[]>([]); // for animation
    const [lastDrawn, setLastDrawn] = useState<boolean>(false); // for draw animation
    const [restartVotes, setRestartVotes] = useState<{ votes: number; total: number; voters: string[] } | null>(null);

    const { playSound } = useSound();

    // Stable refs to avoid stale closures in socket listeners
    const playSoundRef = useRef(playSound);
    const playerIdRef = useRef<string | null>(null);
    const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Keep refs in sync with latest values
    useEffect(() => { playSoundRef.current = playSound; }, [playSound]);
    useEffect(() => { playerIdRef.current = playerId; }, [playerId]);

    useEffect(() => {
        const s = getSocket();
        setSocket(s);

        // Try to reconnect from saved playerId
        const savedPlayerId = sessionStorage.getItem(PLAYER_ID_KEY);
        if (savedPlayerId) {
            s.emit(SocketEvent.PLAYER_RECONNECT, { playerId: savedPlayerId });
        }

        // Define named handlers so cleanup removes exactly these handlers
        const onRoomList = (data: ClientRoom[]) => {
            setRooms(data);
        };

        const onRoomUpdate = (data: { room: ClientRoom; playerId?: string }) => {
            setCurrentRoom(data.room);
            if (data.playerId) {
                setPlayerId(data.playerId);
                playerIdRef.current = data.playerId;
                sessionStorage.setItem(PLAYER_ID_KEY, data.playerId);
            }
            // If room switched back to waiting (restart completed), clear game state
            if (data.room.status === 'waiting') {
                setGameState(null);
                setGameOver(null);
                setIsSpectating(false);
                setRestartVotes(null);
                setActionLog([]);
                setFutureCards(null);
                setPickCards(null);
                setEliminated(null);
                setTurnTimeRemaining(30);
                setLastPlayedCards([]);
                setLastDrawn(false);
            }
        };

        const onRoomError = (data: { error: string }) => {
            setError(data.error);
            if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
            errorTimeoutRef.current = setTimeout(() => setError(null), 3000);
        };

        const onGameStart = () => {
            playSoundRef.current('intro');
        };

        const onGameState = (state: ClientGameState) => {
            setGameState(state);
            setTurnTimeRemaining(state.turnTimeRemaining);
        };

        const onGameAction = (data: { action: string }) => {
            setActionLog((prev) => [...prev.slice(-19), data.action]);

            // SFX Logic based on action text
            const act = data.action.toLowerCase();
            if (act.includes('bốc')) playSoundRef.current('draw');
            else if (act.includes('hủy') || act.includes('nope')) playSoundRef.current('nope');
            else if (act.includes('xào')) playSoundRef.current('shuffle');
            else if (act.includes('nổ')) { /* handled by elim event */ }
            else if (act.includes('tháo ngòi')) playSoundRef.current('defuse');
            else if (act.includes('đang chờ')) playSoundRef.current('alarm');
            else playSoundRef.current('play_card');
        };

        const onTurnTimer = (data: { remaining: number; currentPlayerId: string }) => {
            setTurnTimeRemaining(data.remaining);
        };

        const onChatMessage = (msg: ChatMessage) => {
            setMessages((prev) => [...prev.slice(-99), msg]);
        };

        const onChatHistory = (history: ChatMessage[]) => {
            setMessages(history);
        };

        const onSeeFuture = (data: { cards: Card[] }) => {
            setFutureCards(data.cards);
        };

        const onPickCard = (data: { cards: Card[]; source: string }) => {
            setPickCards(data);
        };

        const onGameOver = (data: { winnerId: string | null; winner: { id: string; name: string; avatar: string } | null }) => {
            setGameOver(data);
            if (data.winnerId === playerIdRef.current) {
                playSoundRef.current('win');
            } else {
                playSoundRef.current('lose');
            }
        };

        const onPlayerEliminated = (data: { playerId: string; playerName: string }) => {
            setEliminated(data.playerName);
            playSoundRef.current('explode');
            setTimeout(() => setEliminated(null), 3000);
        };

        const onRestartVote = (data: { votes: number; total: number; voters: string[] }) => {
            setRestartVotes(data);
        };

        s.on(SocketEvent.ROOM_LIST, onRoomList);
        s.on(SocketEvent.ROOM_UPDATE, onRoomUpdate);
        s.on(SocketEvent.ROOM_ERROR, onRoomError);
        s.on(SocketEvent.GAME_START, onGameStart);
        s.on(SocketEvent.GAME_STATE, onGameState);
        s.on(SocketEvent.GAME_ACTION, onGameAction);
        s.on(SocketEvent.GAME_TURN_TIMER, onTurnTimer);
        s.on(SocketEvent.CHAT_MESSAGE, onChatMessage);
        s.on(SocketEvent.CHAT_HISTORY, onChatHistory);
        s.on(SocketEvent.GAME_SEE_FUTURE, onSeeFuture);
        s.on(SocketEvent.GAME_PICK_CARD, onPickCard);
        s.on(SocketEvent.GAME_OVER, onGameOver);
        s.on(SocketEvent.GAME_PLAYER_ELIMINATED, onPlayerEliminated);
        s.on(SocketEvent.GAME_RESTART_VOTE, onRestartVote);

        // Request room list
        s.emit(SocketEvent.ROOM_LIST);

        return () => {
            s.off(SocketEvent.ROOM_LIST, onRoomList);
            s.off(SocketEvent.ROOM_UPDATE, onRoomUpdate);
            s.off(SocketEvent.ROOM_ERROR, onRoomError);
            s.off(SocketEvent.GAME_START, onGameStart);
            s.off(SocketEvent.GAME_STATE, onGameState);
            s.off(SocketEvent.GAME_ACTION, onGameAction);
            s.off(SocketEvent.GAME_TURN_TIMER, onTurnTimer);
            s.off(SocketEvent.CHAT_MESSAGE, onChatMessage);
            s.off(SocketEvent.CHAT_HISTORY, onChatHistory);
            s.off(SocketEvent.GAME_SEE_FUTURE, onSeeFuture);
            s.off(SocketEvent.GAME_PICK_CARD, onPickCard);
            s.off(SocketEvent.GAME_OVER, onGameOver);
            s.off(SocketEvent.GAME_PLAYER_ELIMINATED, onPlayerEliminated);
            s.off(SocketEvent.GAME_RESTART_VOTE, onRestartVote);
        };
    }, []);

    const createRoom = useCallback((playerName: string, playerAvatar: string, roomName: string, password: string, maxPlayers: number) => {
        socket?.emit(SocketEvent.ROOM_CREATE, { playerName, playerAvatar, roomName, password: password || undefined, maxPlayers });
    }, [socket]);

    const joinRoom = useCallback((playerName: string, playerAvatar: string, roomId: string, password?: string) => {
        socket?.emit(SocketEvent.ROOM_JOIN, { playerName, playerAvatar, roomId, password });
    }, [socket]);

    const leaveRoom = useCallback(() => {
        socket?.emit(SocketEvent.ROOM_LEAVE);
        setCurrentRoom(null);
        setPlayerId(null);
        setGameState(null);
        setMessages([]);
        setActionLog([]);
        setGameOver(null);
        setIsSpectating(false);
        setRestartVotes(null);
        sessionStorage.removeItem(PLAYER_ID_KEY);
    }, [socket]);

    const startGame = useCallback(() => {
        socket?.emit(SocketEvent.GAME_START);
    }, [socket]);

    const playCard = useCallback((cardIds: string[], targetId?: string) => {
        if (!currentRoom) return;
        // Trigger play animation
        setLastPlayedCards(cardIds);
        setTimeout(() => setLastPlayedCards([]), 600);
        socket?.emit(SocketEvent.GAME_PLAY_CARD, { roomId: currentRoom.id, cardIds, targetId });
    }, [socket, currentRoom]);

    const drawCard = useCallback(() => {
        if (!currentRoom) return;
        // Trigger draw animation
        setLastDrawn(true);
        setTimeout(() => setLastDrawn(false), 600);
        socket?.emit(SocketEvent.GAME_DRAW_CARD, { roomId: currentRoom.id });
    }, [socket, currentRoom]);

    const defuse = useCallback((insertPosition: number) => {
        if (!currentRoom) return;
        socket?.emit(SocketEvent.GAME_DEFUSE, { roomId: currentRoom.id, insertPosition });
    }, [socket, currentRoom]);

    const giveCard = useCallback((cardId: string) => {
        if (!currentRoom) return;
        socket?.emit(SocketEvent.GAME_GIVE_CARD, { roomId: currentRoom.id, cardId });
    }, [socket, currentRoom]);

    const pickCard = useCallback((cardId: string) => {
        if (!currentRoom) return;
        socket?.emit(SocketEvent.GAME_PICK_CARD, { roomId: currentRoom.id, cardId });
        setPickCards(null);
    }, [socket, currentRoom]);

    const sendMessage = useCallback((message: string) => {
        if (!currentRoom) return;
        socket?.emit(SocketEvent.CHAT_SEND, { roomId: currentRoom.id, message });
    }, [socket, currentRoom]);

    const setReady = useCallback(() => {
        socket?.emit(SocketEvent.GAME_READY);
    }, [socket]);

    const restartGame = useCallback(() => {
        socket?.emit(SocketEvent.GAME_RESTART);
        // local state reset will happen when server sends ROOM_UPDATE after all voted
    }, [socket]);

    const spectate = useCallback(() => {
        setIsSpectating(true);
        setGameOver(null);
    }, []);

    const refreshRooms = useCallback(() => {
        socket?.emit(SocketEvent.ROOM_LIST);
    }, [socket]);

    return {
        rooms, currentRoom, playerId, gameState, messages, error,
        actionLog, futureCards, setFutureCards, pickCards, setPickCards,
        gameOver, setGameOver, isSpectating, eliminated, turnTimeRemaining,
        lastPlayedCards, lastDrawn, restartVotes,
        createRoom, joinRoom, leaveRoom, startGame, playCard, drawCard,
        defuse, giveCard, pickCard, sendMessage, setReady, restartGame, spectate, refreshRooms,
    };
}
