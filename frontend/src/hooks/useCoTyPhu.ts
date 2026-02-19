'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { getSocket } from '@/lib/socket';
import {
    ClientRoom,
    ClientGameState,
    CTP_EVENTS,
} from '@/lib/coTyPhuData';

const STORAGE_KEY = 'ctp_player_id';
const ROOM_KEY = 'ctp_room_id';

type ChatMsg = { playerName: string; message: string; timestamp: number };

export function useCoTyPhu() {
    const [rooms, setRooms] = useState<ClientRoom[]>([]);
    const [currentRoom, setCurrentRoom] = useState<ClientRoom | null>(null);
    const [playerId, setPlayerId] = useState<string | null>(null);
    const [gameState, setGameState] = useState<ClientGameState | null>(null);
    const [messages, setMessages] = useState<ChatMsg[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [gameOver, setGameOver] = useState<{ winnerId: string; winnerName: string } | null>(null);

    const errorTimer = useRef<NodeJS.Timeout | null>(null);
    const playerIdRef = useRef<string | null>(null);
    const prevRoomPlayersRef = useRef<ClientRoom['players']>([]);
    const prevGamePlayersRef = useRef<ClientGameState['players']>([]);
    useEffect(() => { playerIdRef.current = playerId; }, [playerId]);

    const showError = useCallback((msg: string) => {
        setError(msg);
        if (errorTimer.current) clearTimeout(errorTimer.current);
        errorTimer.current = setTimeout(() => setError(null), 4000);
    }, []);

    useEffect(() => {
        const socket = getSocket();

        const onRoomList = (data: ClientRoom[]) => setRooms(data);
        const onRoomUpdate = (data: { room: ClientRoom | null; yourPlayerId?: string }) => {
            // Null room = dissolution (host left) or we just left — go back to lobby
            if (!data.room) {
                setCurrentRoom(null);
                setPlayerId(null);
                setGameState(null);
                setGameOver(null);
                prevRoomPlayersRef.current = [];
                prevGamePlayersRef.current = [];
                sessionStorage.removeItem(STORAGE_KEY);
                sessionStorage.removeItem(ROOM_KEY);
                return;
            }
            // Detect players who left the waiting room
            const prevPlayers = prevRoomPlayersRef.current;
            const newPlayers = data.room.players;
            if (prevPlayers.length > 0 && data.room.status === 'waiting') {
                prevPlayers.forEach(prev => {
                    if (!newPlayers.find(np => np.id === prev.id) && prev.id !== playerIdRef.current) {
                        showError(`${prev.name} đã rời phòng.`);
                    }
                });
            }
            prevRoomPlayersRef.current = newPlayers;

            setCurrentRoom(data.room);
            if (data.yourPlayerId) {
                setPlayerId(data.yourPlayerId);
                playerIdRef.current = data.yourPlayerId;
                sessionStorage.setItem(STORAGE_KEY, data.yourPlayerId);
            }
            if (data.room.status === 'waiting') {
                setGameState(null);
                setGameOver(null);
            }
        };
        const onGameState = (gs: ClientGameState) => {
            // Detect players who just got disconnected mid-game
            const prev = prevGamePlayersRef.current;
            if (prev.length > 0) {
                gs.players.forEach(newP => {
                    const oldP = prev.find(p => p.id === newP.id);
                    if (oldP && !oldP.isDisconnected && newP.isDisconnected && newP.id !== playerIdRef.current) {
                        showError(`${newP.name} đã mất kết nối.`);
                    }
                    if (oldP && !oldP.isBankrupt && newP.isBankrupt && newP.id !== playerIdRef.current) {
                        showError(`${newP.name} đã phá sản!`);
                    }
                });
            }
            prevGamePlayersRef.current = gs.players;
            setGameState(gs);
        };
        const onGameOver = (data: { winnerId: string; winnerName: string }) => setGameOver(data);
        const onError = (msg: string) => showError(msg);
        const onChatMsg = (msg: ChatMsg) => setMessages((prev) => [...prev.slice(-99), msg]);

        socket.on(CTP_EVENTS.ROOM_LIST, onRoomList);
        socket.on(CTP_EVENTS.ROOM_UPDATE, onRoomUpdate);
        socket.on(CTP_EVENTS.GAME_STATE, onGameState);
        socket.on(CTP_EVENTS.GAME_OVER, onGameOver);
        socket.on(CTP_EVENTS.ROOM_ERROR, onError);
        socket.on(CTP_EVENTS.CHAT_MESSAGE, onChatMsg);

        // Try to reconnect saved session
        const savedId = sessionStorage.getItem(STORAGE_KEY);
        const savedRoom = sessionStorage.getItem(ROOM_KEY);
        if (savedId && savedRoom) {
            socket.emit(CTP_EVENTS.PLAYER_RECONNECT, { roomId: savedRoom, playerId: savedId });
        } else {
            socket.emit(CTP_EVENTS.ROOM_LIST);
        }

        return () => {
            socket.off(CTP_EVENTS.ROOM_LIST, onRoomList);
            socket.off(CTP_EVENTS.ROOM_UPDATE, onRoomUpdate);
            socket.off(CTP_EVENTS.GAME_STATE, onGameState);
            socket.off(CTP_EVENTS.GAME_OVER, onGameOver);
            socket.off(CTP_EVENTS.ROOM_ERROR, onError);
            socket.off(CTP_EVENTS.CHAT_MESSAGE, onChatMsg);
        };
    }, [showError]);

    // Track room id for reconnect
    useEffect(() => {
        if (currentRoom?.id) sessionStorage.setItem(ROOM_KEY, currentRoom.id);
    }, [currentRoom?.id]);

    // ── Actions ──────────────────────────────────────────────────
    const createRoom = useCallback(
        (roomName: string, playerName: string, avatar: string, maxPlayers: number, password?: string) => {
            getSocket().emit(CTP_EVENTS.ROOM_CREATE, { playerName, playerAvatar: avatar, roomName, maxPlayers, password });
        },
        [],
    );

    const joinRoom = useCallback(
        (roomId: string, playerName: string, avatar: string, password?: string) => {
            getSocket().emit(CTP_EVENTS.ROOM_JOIN, { roomId, playerName, playerAvatar: avatar, password });
        },
        [],
    );

    const leaveRoom = useCallback(() => {
        getSocket().emit(CTP_EVENTS.ROOM_LEAVE);
        sessionStorage.removeItem(ROOM_KEY);
    }, []);

    const startGame = useCallback(() => {
        getSocket().emit(CTP_EVENTS.GAME_START);
    }, []);

    const rollDice = useCallback(() => {
        getSocket().emit(CTP_EVENTS.ACTION_ROLL_DICE);
    }, []);

    const buyProperty = useCallback(() => {
        getSocket().emit(CTP_EVENTS.ACTION_BUY_PROPERTY);
    }, []);

    const skipBuy = useCallback(() => {
        getSocket().emit(CTP_EVENTS.ACTION_SKIP_BUY);
    }, []);

    const buildAction = useCallback((tileIndex: number, action: 'build' | 'sell') => {
        getSocket().emit(CTP_EVENTS.ACTION_BUILD, { tileIndex, action });
    }, []);

    const mortgageAction = useCallback((tileIndex: number, action: 'mortgage' | 'unmortgage') => {
        getSocket().emit(CTP_EVENTS.ACTION_MORTGAGE, { tileIndex, action });
    }, []);

    const sellProperty = useCallback((tileIndex: number) => {
        getSocket().emit(CTP_EVENTS.ACTION_SELL_PROPERTY, { tileIndex });
    }, []);

    const payJail = useCallback(() => {
        getSocket().emit(CTP_EVENTS.ACTION_PAY_JAIL);
    }, []);

    const useJailCard = useCallback(() => {
        getSocket().emit(CTP_EVENTS.ACTION_USE_JAIL_CARD);
    }, []);

    const endTurn = useCallback(() => {
        getSocket().emit(CTP_EVENTS.ACTION_END_TURN);
    }, []);

    const surrender = useCallback(() => {
        getSocket().emit(CTP_EVENTS.ACTION_SURRENDER);
    }, []);

    const sendChat = useCallback((message: string) => {
        if (!currentRoom) return;
        getSocket().emit(CTP_EVENTS.CHAT_SEND, { roomId: currentRoom.id, message });
    }, [currentRoom]);

    return {
        rooms, currentRoom, playerId, gameState, messages, error, gameOver,
        createRoom, joinRoom, leaveRoom, startGame,
        rollDice, buyProperty, skipBuy, buildAction, mortgageAction,
        sellProperty, payJail, useJailCard, endTurn, surrender, sendChat,
    };
}
