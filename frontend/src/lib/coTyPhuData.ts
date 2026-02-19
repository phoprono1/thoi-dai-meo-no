// ── Shared enums/interfaces for CTP frontend ──
export type TileType =
    | 'property' | 'station' | 'utility'
    | 'tax' | 'chance' | 'community'
    | 'go' | 'jail' | 'free_parking' | 'go_to_jail';

export type PropertyColor =
    | 'brown' | 'light_blue' | 'pink' | 'orange'
    | 'red' | 'yellow' | 'green' | 'dark_blue';

export interface TileInfo {
    index: number;
    name: string;
    type: TileType;
    color?: PropertyColor;
    price?: number;
    image?: string;
    rent?: number[];
}

export interface ClientPlayer {
    id: string;
    name: string;
    avatar: string;
    money: number;
    position: number;
    inJail: boolean;
    jailTurns: number;
    getOutOfJailCards: number;
    isBankrupt: boolean;
    isDisconnected: boolean;
}

export interface ClientOwnedTile {
    tileIndex: number;
    ownerId: string;
    buildings: 0 | 1 | 2 | 3 | 4 | 5;
    isMortgaged: boolean;
}

export interface DiceRoll {
    die1: number;
    die2: number;
    isDouble: boolean;
}

export interface PendingAction {
    type: string;
    playerId: string;
    data?: Record<string, unknown>;
}

export interface DrawnCard {
    id: string;
    type: 'chance' | 'community';
    text: string;
    effect: string;
}

export interface ClientGameState {
    players: ClientPlayer[];
    turnOrder: string[];
    currentPlayerId: string;
    diceRoll: DiceRoll | null;
    pendingAction: PendingAction | null;
    ownedTiles: ClientOwnedTile[];
    currentCard: DrawnCard | null;
    log: string[];
    winner: string | null;
    turnTimeRemaining: number;
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

export const PROPERTY_COLORS: Record<PropertyColor, string> = {
    brown: '#8B4513',
    light_blue: '#87CEEB',
    pink: '#FF69B4',
    orange: '#FFA500',
    red: '#E63946',
    yellow: '#FFD700',
    green: '#2D9947',
    dark_blue: '#1A3A8F',
};

const M = 1_000_000;
export const BOARD_TILES: TileInfo[] = [
    { index: 0, name: 'Xuất Phát', type: 'go', image: 'corners/go.png' },
    { index: 1, name: 'Hà Nội', type: 'property', color: 'brown', price: 1.2 * M, image: 'properties/ha-noi.png', rent: [0.1*M,0.4*M,0.8*M,1.6*M,2*M,4*M] },
    { index: 2, name: 'Khí Vận', type: 'community', image: 'cards/khi-van-back.png' },
    { index: 3, name: 'Hải Dương', type: 'property', color: 'brown', price: 1.4 * M, image: 'properties/hai-duong.png', rent: [0.12*M,0.5*M,1*M,2*M,2.5*M,5*M] },
    { index: 4, name: 'Thuế Thu Nhập', type: 'tax', price: 1.5 * M, image: 'ui/tax-income.png' },
    { index: 5, name: 'Bến Xe HN', type: 'station', price: 2.5 * M, image: 'specials/ben-xe-ha-noi.png', rent: [0.5*M,1*M,2*M,4*M] },
    { index: 6, name: 'Hải Phòng', type: 'property', color: 'light_blue', price: 1.8 * M, image: 'properties/hai-phong.png', rent: [0.15*M,0.6*M,1.2*M,2.4*M,3*M,6*M] },
    { index: 7, name: 'Cơ Hội', type: 'chance', image: 'cards/co-hoi-back.png' },
    { index: 8, name: 'Quảng Ninh', type: 'property', color: 'light_blue', price: 1.9 * M, image: 'properties/quang-ninh.png', rent: [0.16*M,0.65*M,1.3*M,2.6*M,3.2*M,6.5*M] },
    { index: 9, name: 'Lạng Sơn', type: 'property', color: 'light_blue', price: 2.0 * M, image: 'properties/lang-son.png', rent: [0.18*M,0.7*M,1.4*M,2.8*M,3.5*M,7*M] },
    { index: 10, name: 'Thăm Tù', type: 'jail', image: 'corners/jail.png' },
    { index: 11, name: 'Thanh Hóa', type: 'property', color: 'pink', price: 2.6 * M, image: 'properties/thanh-hoa.png', rent: [0.22*M,0.9*M,1.8*M,3.6*M,4.5*M,9*M] },
    { index: 12, name: 'Cty Điện', type: 'utility', price: 3.0 * M, image: 'specials/cong-ty-dien.png' },
    { index: 13, name: 'Nghệ An', type: 'property', color: 'pink', price: 2.8 * M, image: 'properties/nghe-an.png', rent: [0.24*M,1*M,2*M,4*M,5*M,10*M] },
    { index: 14, name: 'Khí Vận', type: 'community', image: 'cards/khi-van-back.png' },
    { index: 15, name: 'Bến Xe MT', type: 'station', price: 2.5 * M, image: 'specials/ben-xe-mien-trung.png', rent: [0.5*M,1*M,2*M,4*M] },
    { index: 16, name: 'Huế', type: 'property', color: 'pink', price: 3.0 * M, image: 'properties/hue.png', rent: [0.26*M,1.1*M,2.2*M,4.4*M,5.5*M,11*M] },
    { index: 17, name: 'Cơ Hội', type: 'chance', image: 'cards/co-hoi-back.png' },
    { index: 18, name: 'Đà Nẵng', type: 'property', color: 'orange', price: 3.2 * M, image: 'properties/da-nang.png', rent: [0.28*M,1.2*M,2.4*M,4.8*M,6*M,12*M] },
    { index: 19, name: 'Quảng Nam', type: 'property', color: 'orange', price: 3.4 * M, image: 'properties/quang-nam.png', rent: [0.3*M,1.3*M,2.6*M,5.2*M,6.5*M,13*M] },
    { index: 20, name: 'Đỗ Xe', type: 'free_parking', image: 'corners/free-parking.png' },
    { index: 21, name: 'Quảng Ngãi', type: 'property', color: 'orange', price: 3.6 * M, image: 'properties/quang-ngai.png', rent: [0.32*M,1.4*M,2.8*M,5.6*M,7*M,14*M] },
    { index: 22, name: 'Khí Vận', type: 'community', image: 'cards/khi-van-back.png' },
    { index: 23, name: 'Bình Định', type: 'property', color: 'red', price: 4.0 * M, image: 'properties/binh-dinh.png', rent: [0.36*M,1.6*M,3.2*M,6.4*M,8*M,16*M] },
    { index: 24, name: 'Nha Trang', type: 'property', color: 'red', price: 4.2 * M, image: 'properties/nha-trang.png', rent: [0.38*M,1.7*M,3.4*M,6.8*M,8.5*M,17*M] },
    { index: 25, name: 'Bến Xe MN', type: 'station', price: 2.5 * M, image: 'specials/ben-xe-mien-nam.png', rent: [0.5*M,1*M,2*M,4*M] },
    { index: 26, name: 'Đà Lạt', type: 'property', color: 'red', price: 4.4 * M, image: 'properties/da-lat.png', rent: [0.4*M,1.8*M,3.6*M,7.2*M,9*M,18*M] },
    { index: 27, name: 'Cơ Hội', type: 'chance', image: 'cards/co-hoi-back.png' },
    { index: 28, name: 'Vũng Tàu', type: 'property', color: 'yellow', price: 4.8 * M, image: 'properties/vung-tau.png', rent: [0.44*M,2*M,4*M,8*M,10*M,20*M] },
    { index: 29, name: 'Bình Dương', type: 'property', color: 'yellow', price: 5.0 * M, image: 'properties/binh-duong.png', rent: [0.46*M,2.1*M,4.2*M,8.4*M,10.5*M,21*M] },
    { index: 30, name: 'Vào Tù', type: 'go_to_jail', image: 'corners/go-to-jail.png' },
    { index: 31, name: 'Đồng Nai', type: 'property', color: 'yellow', price: 5.2 * M, image: 'properties/dong-nai.png', rent: [0.48*M,2.2*M,4.4*M,8.8*M,11*M,22*M] },
    { index: 32, name: 'Cty Nước', type: 'utility', price: 3.0 * M, image: 'specials/cong-ty-nuoc.png' },
    { index: 33, name: 'Cần Thơ', type: 'property', color: 'green', price: 5.6 * M, image: 'properties/can-tho.png', rent: [0.5*M,2.4*M,4.8*M,9.6*M,12*M,24*M] },
    { index: 34, name: 'Thuế Sang Trọng', type: 'tax', price: 2.0 * M, image: 'ui/tax-luxury.png' },
    { index: 35, name: 'Sân Bay TSN', type: 'station', price: 2.5 * M, image: 'specials/san-bay-tsn.png', rent: [0.5*M,1*M,2*M,4*M] },
    { index: 36, name: 'Long An', type: 'property', color: 'green', price: 6.0 * M, image: 'properties/long-an.png', rent: [0.54*M,2.6*M,5.2*M,10.4*M,13*M,26*M] },
    { index: 37, name: 'Khí Vận', type: 'community', image: 'cards/khi-van-back.png' },
    { index: 38, name: 'TP. HCM', type: 'property', color: 'dark_blue', price: 7.0 * M, image: 'properties/ho-chi-minh.png', rent: [0.7*M,3.5*M,7*M,14*M,17.5*M,35*M] },
    { index: 39, name: 'Phú Quốc', type: 'property', color: 'dark_blue', price: 8.0 * M, image: 'properties/phu-quoc.png', rent: [1*M,5*M,10*M,20*M,25*M,50*M] },
];

// Map tile index → css grid position (1-based)
export function getTileGridPos(index: number): { col: number; row: number } {
    if (index === 0) return { col: 11, row: 11 };
    if (index >= 1 && index <= 9) return { col: 11 - index, row: 11 };
    if (index === 10) return { col: 1, row: 11 };
    if (index >= 11 && index <= 19) return { col: 1, row: 21 - index };
    if (index === 20) return { col: 1, row: 1 };
    if (index >= 21 && index <= 29) return { col: index - 19, row: 1 };
    if (index === 30) return { col: 11, row: 1 };
    if (index >= 31 && index <= 39) return { col: 11, row: index - 29 };
    return { col: 1, row: 1 };
}

// Which side the color bar faces (inward toward center)
export function getTileFacing(index: number): 'top' | 'bottom' | 'left' | 'right' | 'none' {
    if ([0, 10, 20, 30].includes(index)) return 'none';
    if (index >= 1 && index <= 9) return 'top';
    if (index >= 11 && index <= 19) return 'right';
    if (index >= 21 && index <= 29) return 'bottom';
    if (index >= 31 && index <= 39) return 'left';
    return 'none';
}

export function formatMoney(amount: number): string {
    if (amount >= 1_000_000) {
        const v = amount / 1_000_000;
        return `${v % 1 === 0 ? v : v.toFixed(1)}tr`;
    }
    if (amount >= 1_000) return `${Math.round(amount / 1_000)}k`;
    return `${amount}đ`;
}

export const PLAYER_COLORS = [
    '#EF4444', // red
    '#3B82F6', // blue
    '#22C55E', // green
    '#F59E0B', // amber
    '#A855F7', // purple
    '#F97316', // orange
    '#EC4899', // pink
    '#14B8A6', // teal
];

// Socket events for quick reference
export const CTP_EVENTS = {
    ROOM_CREATE: 'ctp:room:create',
    ROOM_JOIN: 'ctp:room:join',
    ROOM_LEAVE: 'ctp:room:leave',
    ROOM_LIST: 'ctp:room:list',
    ROOM_UPDATE: 'ctp:room:update',
    ROOM_ERROR: 'ctp:room:error',
    PLAYER_READY: 'ctp:player:ready',
    PLAYER_RECONNECT: 'ctp:player:reconnect',
    GAME_START: 'ctp:game:start',
    GAME_STATE: 'ctp:game:state',
    GAME_OVER: 'ctp:game:over',
    ACTION_ROLL_DICE: 'ctp:action:rollDice',
    ACTION_BUY_PROPERTY: 'ctp:action:buyProperty',
    ACTION_SKIP_BUY: 'ctp:action:skipBuy',
    ACTION_BUILD: 'ctp:action:build',
    ACTION_SELL_BUILDING: 'ctp:action:sellBuilding',
    ACTION_MORTGAGE: 'ctp:action:mortgage',
    ACTION_UNMORTGAGE: 'ctp:action:unmortgage',
    ACTION_SELL_PROPERTY: 'ctp:action:sellProperty',
    ACTION_PAY_JAIL: 'ctp:action:payJail',
    ACTION_USE_JAIL_CARD: 'ctp:action:useJailCard',
    ACTION_END_TURN: 'ctp:action:endTurn',
    ACTION_SURRENDER: 'ctp:action:surrender',
    CHAT_SEND: 'ctp:chat:send',
    CHAT_MESSAGE: 'ctp:chat:message',
} as const;
