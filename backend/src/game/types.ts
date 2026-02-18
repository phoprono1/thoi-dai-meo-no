// ============================================
// Shared Types - Game Mèo Nổ
// ============================================

export enum CardType {
    EXPLODING_KITTEN = 'exploding_kitten',
    DEFUSE = 'defuse',
    SKIP = 'skip',
    ATTACK = 'attack',
    SHUFFLE = 'shuffle',
    SEE_THE_FUTURE = 'see_the_future',
    NOPE = 'nope',
    FAVOR = 'favor',
    CAT_1 = 'cat_1', // Mèo Đào
    CAT_2 = 'cat_2', // Mèo Mai
    CAT_3 = 'cat_3', // Mèo Bánh Chưng
    CAT_4 = 'cat_4', // Mèo Lì Xì
    CAT_5 = 'cat_5', // Mèo Pháo
}

export const CAT_CARDS = [
    CardType.CAT_1,
    CardType.CAT_2,
    CardType.CAT_3,
    CardType.CAT_4,
    CardType.CAT_5,
];

export interface Card {
    id: string;
    type: CardType;
}

export const CARD_INFO: Record<
    CardType,
    { name: string; emoji: string; description: string; color: string }
> = {
    [CardType.EXPLODING_KITTEN]: {
        name: 'Pháo Mèo',
        emoji: '🧨',
        description: 'Bốc phải = thua! Trừ khi bạn có Tháo Ngòi.',
        color: '#ff4444',
    },
    [CardType.DEFUSE]: {
        name: 'Tháo Ngòi',
        emoji: '🧯',
        description: 'Vô hiệu Pháo Mèo và đặt lại vào bộ bài.',
        color: '#4CAF50',
    },
    [CardType.SKIP]: {
        name: 'Bỏ Lượt',
        emoji: '🏃',
        description: 'Kết thúc lượt mà không cần bốc bài.',
        color: '#2196F3',
    },
    [CardType.ATTACK]: {
        name: 'Tấn Công',
        emoji: '⚔️',
        description: 'Kết thúc lượt, người kế tiếp bốc 2 lần.',
        color: '#FF9800',
    },
    [CardType.SHUFFLE]: {
        name: 'Xáo Bài',
        emoji: '🔀',
        description: 'Xáo trộn ngẫu nhiên bộ bài.',
        color: '#9C27B0',
    },
    [CardType.SEE_THE_FUTURE]: {
        name: 'Bói Tết',
        emoji: '🔮',
        description: 'Xem 3 lá bài trên cùng của bộ bài.',
        color: '#673AB7',
    },
    [CardType.NOPE]: {
        name: 'Phản Đòn',
        emoji: '🚫',
        description: 'Hủy bất kỳ hành động nào (trừ Pháo Mèo/Tháo Ngòi).',
        color: '#f44336',
    },
    [CardType.FAVOR]: {
        name: 'Xin Lì Xì',
        emoji: '🧧',
        description: 'Bắt 1 người chơi khác cho bạn 1 lá bài.',
        color: '#E91E63',
    },
    [CardType.CAT_1]: {
        name: 'Mèo Đào',
        emoji: '🌸',
        description: 'Chơi 2 lá giống → lấy 1 lá ngẫu nhiên từ đối thủ.',
        color: '#FF8A80',
    },
    [CardType.CAT_2]: {
        name: 'Mèo Mai',
        emoji: '🌼',
        description: 'Chơi 2 lá giống → lấy 1 lá ngẫu nhiên từ đối thủ.',
        color: '#FFD54F',
    },
    [CardType.CAT_3]: {
        name: 'Mèo Bánh Chưng',
        emoji: '🥘',
        description: 'Chơi 2 lá giống → lấy 1 lá ngẫu nhiên từ đối thủ.',
        color: '#81C784',
    },
    [CardType.CAT_4]: {
        name: 'Mèo Lì Xì',
        emoji: '🧧',
        description: 'Chơi 2 lá giống → lấy 1 lá ngẫu nhiên từ đối thủ.',
        color: '#FF5252',
    },
    [CardType.CAT_5]: {
        name: 'Mèo Pháo',
        emoji: '🧨',
        description: 'Chơi 2 lá giống → lấy 1 lá ngẫu nhiên từ đối thủ.',
        color: '#FF6E40',
    },
};

export interface Player {
    id: string;
    socketId: string;
    name: string;
    avatar: string;
    hand: Card[];
    isAlive: boolean;
    isReady: boolean;
    isDisconnected: boolean;
    disconnectTimeout: NodeJS.Timeout | null;
}

export interface Room {
    id: string;
    name: string;
    password: string | null;
    hostId: string;
    maxPlayers: number;
    players: Player[];
    status: RoomStatus;
    gameState: GameState | null;
}

export enum RoomStatus {
    WAITING = 'waiting',
    PLAYING = 'playing',
    FINISHED = 'finished',
}

export interface GameState {
    deck: Card[];
    discardPile: Card[];
    currentPlayerIndex: number;
    turnOrder: string[]; // player IDs in turn order
    drawsRemaining: number; // normally 1, 2 after Attack
    pendingAction: PendingAction | null;
    nopeTimer: NodeJS.Timeout | null;
    lastPlayedAction: PlayedAction | null;
    winner: string | null;
    turnStartTime: number; // timestamp ms
    turnTimeLimit: number; // seconds (default 30)
    turnTimer: NodeJS.Timeout | null;
    actionTimer?: NodeJS.Timeout | null; // Timer for NOPE window
    actionTimeLimit?: number; // timestamp when action executes
}

export interface PendingAction {
    type: 'favor_give' | 'defuse_insert' | 'see_future' | 'pick_card_from_player' | 'delayed_effect';
    playerId: string;
    targetId?: string;
    data?: any;
}

export interface PlayedAction {
    playerId: string;
    cardType: CardType;
    targetId?: string;
    timestamp: number;
}

export interface ChatMessage {
    id: string;
    roomId: string;
    playerName: string;
    playerAvatar: string;
    message: string;
    timestamp: number;
    isSystem: boolean;
}

// Socket Events
export enum SocketEvent {
    // Room events
    ROOM_CREATE = 'room:create',
    ROOM_JOIN = 'room:join',
    ROOM_LEAVE = 'room:leave',
    ROOM_LIST = 'room:list',
    ROOM_UPDATE = 'room:update',
    ROOM_ERROR = 'room:error',

    // Game events
    GAME_START = 'game:start',
    GAME_PLAY_CARD = 'game:playCard',
    GAME_DRAW_CARD = 'game:drawCard',
    GAME_DEFUSE = 'game:defuse',
    GAME_GIVE_CARD = 'game:giveCard',
    GAME_NOPE = 'game:nope',
    GAME_STATE = 'game:state',
    GAME_ACTION = 'game:action',
    GAME_OVER = 'game:over',
    GAME_PLAYER_ELIMINATED = 'game:playerEliminated',
    GAME_READY = 'game:ready',
    GAME_SEE_FUTURE = 'game:seeFuture',
    GAME_PICK_CARD = 'game:pickCard',
    GAME_TURN_TIMER = 'game:turnTimer',

    // Chat events
    CHAT_SEND = 'chat:send',
    CHAT_MESSAGE = 'chat:message',
    CHAT_HISTORY = 'chat:history',

    // Connection
    PLAYER_DISCONNECT = 'player:disconnect',
    PLAYER_RECONNECT = 'player:reconnect',
}

// Client -> Server payloads
export interface CreateRoomPayload {
    playerName: string;
    playerAvatar: string;
    roomName: string;
    password?: string;
    maxPlayers: number;
}

export interface JoinRoomPayload {
    playerName: string;
    playerAvatar: string;
    roomId: string;
    password?: string;
}

export interface PlayCardPayload {
    roomId: string;
    cardIds: string[]; // support playing multiple cards at once (cat combos)
    targetId?: string;
}

export interface DrawCardPayload {
    roomId: string;
}

export interface DefusePayload {
    roomId: string;
    insertPosition: number; // where to put the Exploding Kitten back
}

export interface GiveCardPayload {
    roomId: string;
    cardId: string;
}

export interface NopePayload {
    roomId: string;
}

export interface ChatSendPayload {
    roomId: string;
    message: string;
}

// Server -> Client state (sanitized per player)
export interface ClientGameState {
    myHand: Card[];
    players: ClientPlayer[];
    deckCount: number;
    discardPile: Card[];
    currentPlayerId: string;
    drawsRemaining: number;
    pendingAction: PendingAction | null;
    lastPlayedAction: PlayedAction | null;
    winner: string | null;
    turnTimeRemaining: number; // seconds
}

export interface ClientPlayer {
    id: string;
    name: string;
    avatar: string;
    cardCount: number;
    isAlive: boolean;
    isReady: boolean;
    isDisconnected: boolean;
}

export interface ClientRoom {
    id: string;
    name: string;
    hasPassword: boolean;
    hostId: string;
    maxPlayers: number;
    players: ClientPlayer[];
    status: RoomStatus;
}
