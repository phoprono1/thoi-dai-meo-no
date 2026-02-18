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
    const [eliminated, setEliminated] = useState<string | null>(null);
    const [turnTimeRemaining, setTurnTimeRemaining] = useState<number>(30);
    const [lastPlayedCards, setLastPlayedCards] = useState<string[]>([]); // for animation
    const [lastDrawn, setLastDrawn] = useState<boolean>(false); // for draw animation

    const { playSound } = useSound();

    const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const s = getSocket();
        setSocket(s);

        // Try to reconnect from saved playerId
        const savedPlayerId = sessionStorage.getItem(PLAYER_ID_KEY);
        if (savedPlayerId) {
            s.emit(SocketEvent.PLAYER_RECONNECT, { playerId: savedPlayerId });
        }

        s.on(SocketEvent.ROOM_LIST, (data: ClientRoom[]) => {
            setRooms(data);
        });

        s.on(SocketEvent.ROOM_UPDATE, (data: { room: ClientRoom; playerId?: string }) => {
            setCurrentRoom(data.room);
            if (data.playerId) {
                setPlayerId(data.playerId);
                sessionStorage.setItem(PLAYER_ID_KEY, data.playerId);
            }
        });

        s.on(SocketEvent.ROOM_ERROR, (data: { error: string }) => {
            setError(data.error);
            if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
            errorTimeoutRef.current = setTimeout(() => setError(null), 3000);
        });

        s.on(SocketEvent.GAME_START, () => {
            playSound('intro');
        });

        s.on(SocketEvent.GAME_STATE, (state: ClientGameState) => {
            setGameState(state);
            setTurnTimeRemaining(state.turnTimeRemaining);
        });

        s.on(SocketEvent.GAME_ACTION, (data: { action: string }) => {
            setActionLog((prev) => [...prev.slice(-19), data.action]);

            // SFX Logic based on action text
            const act = data.action.toLowerCase();
            if (act.includes('bốc')) playSound('draw');
            else if (act.includes('hủy') || act.includes('nope')) playSound('nope');
            else if (act.includes('xào')) playSound('shuffle');
            else if (act.includes('nổ')) { /* handled by elim event */ }
            else if (act.includes('tháo ngòi')) playSound('defuse');
            else if (act.includes('đang chờ')) playSound('alarm');
            else playSound('play_card');
        });

        s.on(SocketEvent.GAME_TURN_TIMER, (data: { remaining: number; currentPlayerId: string }) => {
            setTurnTimeRemaining(data.remaining);
        });

        s.on(SocketEvent.CHAT_MESSAGE, (msg: ChatMessage) => {
            setMessages((prev) => [...prev.slice(-99), msg]);
        });

        s.on(SocketEvent.CHAT_HISTORY, (history: ChatMessage[]) => {
            setMessages(history);
        });

        s.on(SocketEvent.GAME_SEE_FUTURE, (data: { cards: Card[] }) => {
            setFutureCards(data.cards);
        });

        s.on(SocketEvent.GAME_PICK_CARD, (data: { cards: Card[]; source: string }) => {
            setPickCards(data);
        });

        s.on(SocketEvent.GAME_OVER, (data: { winnerId: string }) => {
            setGameOver(data);
            if (data.winnerId === playerId) {
                playSound('win');
            } else {
                playSound('lose');
            }
        });

        s.on(SocketEvent.GAME_PLAYER_ELIMINATED, (data: { playerId: string; playerName: string }) => {
            setEliminated(data.playerName);
            playSound('explode');
            setTimeout(() => setEliminated(null), 3000);
        });

        // Request room list
        s.emit(SocketEvent.ROOM_LIST);

        return () => {
            s.off(SocketEvent.ROOM_LIST);
            s.off(SocketEvent.ROOM_UPDATE);
            s.off(SocketEvent.ROOM_ERROR);
            s.off(SocketEvent.GAME_STATE);
            s.off(SocketEvent.GAME_ACTION);
            s.off(SocketEvent.GAME_TURN_TIMER);
            s.off(SocketEvent.CHAT_MESSAGE);
            s.off(SocketEvent.CHAT_HISTORY);
            s.off(SocketEvent.GAME_SEE_FUTURE);
            s.off(SocketEvent.GAME_PICK_CARD);
            s.off(SocketEvent.GAME_OVER);
            s.off(SocketEvent.GAME_PLAYER_ELIMINATED);
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
        setGameState(null);
        setGameOver(null);
        setActionLog([]);
    }, [socket]);

    const refreshRooms = useCallback(() => {
        socket?.emit(SocketEvent.ROOM_LIST);
    }, [socket]);

    return {
        rooms, currentRoom, playerId, gameState, messages, error,
        actionLog, futureCards, setFutureCards, pickCards, setPickCards,
        gameOver, setGameOver, eliminated, turnTimeRemaining,
        lastPlayedCards, lastDrawn,
        createRoom, joinRoom, leaveRoom, startGame, playCard, drawCard,
        defuse, giveCard, pickCard, sendMessage, setReady, restartGame, refreshRooms,
    };
}
