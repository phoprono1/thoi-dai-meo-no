// Shared Types - Frontend
// Copied from backend for consistency

export enum CardType {
    EXPLODING_KITTEN = 'exploding_kitten',
    DEFUSE = 'defuse',
    SKIP = 'skip',
    ATTACK = 'attack',
    SHUFFLE = 'shuffle',
    SEE_THE_FUTURE = 'see_the_future',
    NOPE = 'nope',
    FAVOR = 'favor',
    CAT_1 = 'cat_1',
    CAT_2 = 'cat_2',
    CAT_3 = 'cat_3',
    CAT_4 = 'cat_4',
    CAT_5 = 'cat_5',
}

export const CAT_CARDS = [CardType.CAT_1, CardType.CAT_2, CardType.CAT_3, CardType.CAT_4, CardType.CAT_5];

export interface Card {
    id: string;
    type: CardType;
}

export const CARD_INFO: Record<CardType, { name: string; description: string; shortDesc: string; emoji: string; color: string; image: string }> = {
    [CardType.DEFUSE]: {
        name: 'Tháo Ngòi',
        description: 'Vô hiệu hóa Pháo Mèo. Bạn có thể đặt lại Pháo Mèo vào bất kỳ đâu trong bộ bài.',
        shortDesc: 'Cứu mạng!',
        emoji: '🧯',
        color: '#4CAF50',
        image: '/assets/cards/defuse.png',
    },
    [CardType.EXPLODING_KITTEN]: {
        name: 'Pháo Mèo',
        description: 'Nếu bốc phải lá này, bạn sẽ bị loại ngay lập tức (trừ khi có Tháo Ngòi).',
        shortDesc: 'Bùm!',
        emoji: '💣',
        color: '#000000',
        image: '/assets/cards/exploding_kitten.png',
    },
    [CardType.ATTACK]: {
        name: 'Tấn Công',
        description: 'Kết thúc lượt ngay lập tức và ép người tiếp theo phải đi 2 lượt liên tiếp.',
        shortDesc: 'Công 2x',
        emoji: '🔫',
        color: '#FF9800',
        image: '/assets/cards/attack.png',
    },
    [CardType.SKIP]: {
        name: 'Bỏ Lượt',
        description: 'Kết thúc lượt ngay lập tức mà không cần bốc bài.',
        shortDesc: 'Qua lượt',
        emoji: '⏭️',
        color: '#2196F3',
        image: '/assets/cards/skip.png',
    },
    [CardType.FAVOR]: {
        name: 'Xin Lì Xì',
        description: 'Chọn một người chơi, họ phải đưa cho bạn 1 lá bài do họ chọn.',
        shortDesc: 'Xin bài',
        emoji: '🙏',
        color: '#9C27B0',
        image: '/assets/cards/favor.png',
    },
    [CardType.SHUFFLE]: {
        name: 'Xáo Bài',
        description: 'Xáo trộn ngẫu nhiên bộ bài.',
        shortDesc: 'Xáo bài',
        emoji: '🔀',
        color: '#795548',
        image: '/assets/cards/shuffle.png',
    },
    [CardType.SEE_THE_FUTURE]: {
        name: 'Bói Tết',
        description: 'Xem trước 3 lá bài trên cùng của bộ bài.',
        shortDesc: 'Soi 3 lá',
        emoji: '🔮',
        color: '#E91E63',
        image: '/assets/cards/see_the_future.png',
    },
    [CardType.NOPE]: {
        name: 'Phản Đòn',
        description: 'Chặn bất kỳ hành động nào (trừ Pháo Mèo và Tháo Ngòi). Có thể dùng bất cứ lúc nào.',
        shortDesc: 'Chặn đứng',
        emoji: '🚫',
        color: '#F44336',
        image: '/assets/cards/nope.png',
    },
    [CardType.CAT_1]: {
        name: 'Mèo Đào',
        description: 'Không có tác dụng khi đánh lẻ. Ra 2 lá giống nhau để cướp bài ngẫu nhiên.',
        shortDesc: 'Mèo thường',
        emoji: '🌸',
        color: '#607D8B',
        image: '/assets/cards/cat_1.png',
    },
    [CardType.CAT_2]: {
        name: 'Mèo Mai',
        description: 'Không có tác dụng khi đánh lẻ. Ra 2 lá giống nhau để cướp bài ngẫu nhiên.',
        shortDesc: 'Mèo thường',
        emoji: '🌼',
        color: '#607D8B',
        image: '/assets/cards/cat_2.png',
    },
    [CardType.CAT_3]: {
        name: 'Mèo Bánh Chưng',
        description: 'Không có tác dụng khi đánh lẻ. Ra 2 lá giống nhau để cướp bài ngẫu nhiên.',
        shortDesc: 'Mèo thường',
        emoji: '🥘',
        color: '#607D8B',
        image: '/assets/cards/cat_3.png',
    },
    [CardType.CAT_4]: {
        name: 'Mèo Lì Xì',
        description: 'Không có tác dụng khi đánh lẻ. Ra 2 lá giống nhau để cướp bài ngẫu nhiên.',
        shortDesc: 'Mèo thường',
        emoji: '🧧',
        color: '#607D8B',
        image: '/assets/cards/cat_4.png',
    },
    [CardType.CAT_5]: {
        name: 'Mèo Pháo',
        description: 'Không có tác dụng khi đánh lẻ. Ra 2 lá giống nhau để cướp bài ngẫu nhiên.',
        shortDesc: 'Mèo thường',
        emoji: '🧨',
        color: '#607D8B',
        image: '/assets/cards/cat_5.png',
    },
};

export const CARD_BACK_IMAGE = '/assets/cards/card_back.png';

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
    turnTimeRemaining: number;
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
    status: 'waiting' | 'playing' | 'finished';
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

export const AVATARS = [
    { id: 'avatar_1', name: 'Mèo Áo Dài', emoji: '🐱', image: '/assets/avatars/avatar_1.png' },
    { id: 'avatar_2', name: 'Mèo Khăn Đóng', emoji: '🐈', image: '/assets/avatars/avatar_2.png' },
    { id: 'avatar_3', name: 'Mèo Nón Lá', emoji: '🐾', image: '/assets/avatars/avatar_3.png' },
    { id: 'avatar_4', name: 'Mèo Ninja', emoji: '😼', image: '/assets/avatars/avatar_4.png' },
    { id: 'avatar_5', name: 'Mèo Đầu Bếp', emoji: '😺', image: '/assets/avatars/avatar_5.png' },
    { id: 'avatar_6', name: 'Mèo Múa Lân', emoji: '😻', image: '/assets/avatars/avatar_6.png' },
    { id: 'avatar_7', name: 'Mèo Hoa Đào', emoji: '😸', image: '/assets/avatars/avatar_7.png' },
    { id: 'avatar_8', name: 'Mèo Ông Đồ', emoji: '😽', image: '/assets/avatars/avatar_8.png' },
];

export enum SocketEvent {
    ROOM_CREATE = 'room:create',
    ROOM_JOIN = 'room:join',
    ROOM_LEAVE = 'room:leave',
    ROOM_LIST = 'room:list',
    ROOM_UPDATE = 'room:update',
    ROOM_ERROR = 'room:error',
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
    GAME_RESTART = 'game:restart',
    GAME_RESTART_VOTE = 'game:restartVote',
    GAME_TURN_TIMER = 'game:turnTimer',
    CHAT_SEND = 'chat:send',
    CHAT_MESSAGE = 'chat:message',
    CHAT_HISTORY = 'chat:history',
    PLAYER_RECONNECT = 'player:reconnect',
}
