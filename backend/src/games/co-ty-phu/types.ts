// ============================================
// Shared Types - Game Cờ Tỷ Phú Việt Nam
// ============================================

// ── Tile types ──────────────────────────────
export enum TileType {
  PROPERTY = 'property', // Ô đất mua được (22 ô)
  STATION = 'station', // Bến xe/ga/sân bay (4 ô)
  UTILITY = 'utility', // Công ty Điện/Nước (2 ô)
  TAX = 'tax', // Thuế thu nhập / sang trọng
  CHANCE = 'chance', // Cơ Hội
  COMMUNITY = 'community', // Khí Vận
  GO = 'go', // Xuất Phát
  JAIL = 'jail', // Thăm Tù / Ở Tù
  FREE_PARKING = 'free_parking', // Đỗ Xe
  GO_TO_JAIL = 'go_to_jail', // Vào Tù
}

export enum PropertyColor {
  BROWN = 'brown',
  LIGHT_BLUE = 'light_blue',
  PINK = 'pink',
  ORANGE = 'orange',
  RED = 'red',
  YELLOW = 'yellow',
  GREEN = 'green',
  DARK_BLUE = 'dark_blue',
}

// ── Tile definition ─────────────────────────
export interface Tile {
  index: number;
  name: string;
  type: TileType;
  color?: PropertyColor; // chỉ có ở PROPERTY
  price?: number; // giá mua (triệu VND)
  housePrice?: number; // giá xây 1 nhà
  hotelPrice?: number; // giá xây khách sạn (= 5 nhà)
  rent?: number[]; // [0 nhà, 1, 2, 3, 4, KS]
  taxAmount?: number; // dành cho ô Thuế
  image?: string; // tên file ảnh trong assets
}

// ── Building state ───────────────────────────
export type BuildingCount = 0 | 1 | 2 | 3 | 4 | 5; // 5 = khách sạn

export interface OwnedTile {
  tileIndex: number;
  ownerId: string;
  buildings: BuildingCount; // 0-4 nhà, 5 = khách sạn
  isMortgaged: boolean;
}

// ── Player ───────────────────────────────────
export interface MonopolyPlayer {
  id: string;
  socketId: string;
  name: string;
  avatar: string;
  money: number;
  position: number; // 0-39
  inJail: boolean;
  jailTurns: number; // số lượt đã ngồi tù
  getOutOfJailCards: number; // số thẻ thoát tù
  isBankrupt: boolean;
  isDisconnected: boolean;
  disconnectTimeout: NodeJS.Timeout | null;
}

// ── Dice ────────────────────────────────────
export interface DiceRoll {
  die1: number;
  die2: number;
  isDouble: boolean;
}

// ── Pending action ──────────────────────────
export type PendingActionType =
  | 'buy_property' // người chơi có thể mua hay bỏ qua
  | 'pay_rent' // phải trả tiền thuê
  | 'pay_tax' // phải trả thuế
  | 'draw_chance' // đang xử lý thẻ Cơ Hội
  | 'draw_community' // đang xử lý thẻ Khí Vận
  | 'jail_decision' // đang ở tù: trả tiền / dùng thẻ / đổ xúc xắc
  | 'sell_to_pay' // phá sản: phải bán tài sản để trả nợ
  | 'build_or_sell'; // lượt xây nhà/bán nhà (hành động tự nguyện)

export interface PendingAction {
  type: PendingActionType;
  playerId: string;
  data?: Record<string, unknown>;
}

// ── Card ────────────────────────────────────
export enum CardEffect {
  MOVE_TO = 'move_to', // tiến đến ô cụ thể
  MOVE_BACK = 'move_back', // lùi N bước
  MOVE_TO_NEAREST_STATION = 'move_to_nearest_station', // tiến đến bến tàu gần nhất
  MOVE_TO_NEAREST_UTILITY = 'move_to_nearest_utility', // tiến đến tiện ích gần nhất
  COLLECT = 'collect', // nhận tiền từ ngân hàng
  PAY = 'pay', // trả tiền cho ngân hàng
  COLLECT_FROM_PLAYERS = 'collect_from_players', // nhận tiền từ mỗi người
  PAY_TO_PLAYERS = 'pay_to_players', // trả tiền cho mỗi người
  GO_TO_JAIL = 'go_to_jail', // vào tù
  GET_OUT_OF_JAIL = 'get_out_of_jail', // thẻ thoát tù
  HOUSE_HOTEL_TAX = 'house_hotel_tax', // thuế nhà/khách sạn
}

export interface Card {
  id: string;
  type: 'chance' | 'community';
  text: string;
  effect: CardEffect;
  value?: number; // số tiền, số bước, hoặc index ô đến
  perHouse?: number; // cho HOUSE_HOTEL_TAX
  perHotel?: number;
}

// ── Room status ──────────────────────────────
export enum RoomStatus {
  WAITING = 'waiting',
  PLAYING = 'playing',
  FINISHED = 'finished',
}

// ── Game state ───────────────────────────────
export interface MonopolyGameState {
  players: MonopolyPlayer[];
  turnOrder: string[]; // player IDs
  currentPlayerIndex: number;
  diceRoll: DiceRoll | null;
  consecutiveDoubles: number; // đổ đôi liên tiếp (3 lần = vào tù)
  pendingAction: PendingAction | null;
  ownedTiles: Map<number, OwnedTile>; // key = tile index
  chanceDeck: Card[];
  communityDeck: Card[];
  chanceDiscardPile: Card[];
  communityDiscardPile: Card[];
  currentCard: Card | null; // thẻ đang xử lý
  log: string[]; // action log
  winner: string | null;
  turnStartTime: number;
  turnTimeLimit: number; // giây
  turnTimer: NodeJS.Timeout | null;
}

// ── Room ─────────────────────────────────────
export interface MonopolyRoom {
  id: string;
  name: string;
  password: string | null;
  hostId: string;
  maxPlayers: number;
  players: MonopolyPlayer[];
  status: RoomStatus;
  gameState: MonopolyGameState | null;
}

// ── Client-safe types ─────────────────────────
export interface ClientMonopolyPlayer {
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
  buildings: BuildingCount;
  isMortgaged: boolean;
}

export interface ClientMonopolyGameState {
  players: ClientMonopolyPlayer[];
  turnOrder: string[];
  currentPlayerId: string;
  diceRoll: DiceRoll | null;
  pendingAction: PendingAction | null;
  ownedTiles: ClientOwnedTile[];
  currentCard: Card | null;
  log: string[];
  winner: string | null;
  turnTimeRemaining: number;
}

export interface ClientMonopolyRoom {
  id: string;
  name: string;
  hasPassword: boolean;
  hostId: string;
  maxPlayers: number;
  players: ClientMonopolyPlayer[];
  status: RoomStatus;
}

// ── Socket Events ─────────────────────────────
export enum SocketEvent {
  // Room
  ROOM_CREATE = 'ctp:room:create',
  ROOM_JOIN = 'ctp:room:join',
  ROOM_LEAVE = 'ctp:room:leave',
  ROOM_LIST = 'ctp:room:list',
  ROOM_UPDATE = 'ctp:room:update',
  ROOM_ERROR = 'ctp:room:error',
  PLAYER_READY = 'ctp:player:ready',

  // Game
  GAME_START = 'ctp:game:start',
  GAME_STATE = 'ctp:game:state',
  GAME_ACTION = 'ctp:game:action',
  GAME_OVER = 'ctp:game:over',
  GAME_TURN_TIMER = 'ctp:game:turnTimer',

  // Player actions
  ACTION_ROLL_DICE = 'ctp:action:rollDice',
  ACTION_BUY_PROPERTY = 'ctp:action:buyProperty',
  ACTION_SKIP_BUY = 'ctp:action:skipBuy',
  ACTION_BUILD = 'ctp:action:build',
  ACTION_SELL_BUILDING = 'ctp:action:sellBuilding',
  ACTION_MORTGAGE = 'ctp:action:mortgage',
  ACTION_UNMORTGAGE = 'ctp:action:unmortgage',
  ACTION_SELL_PROPERTY = 'ctp:action:sellProperty',
  ACTION_PAY_JAIL = 'ctp:action:payJail',
  ACTION_USE_JAIL_CARD = 'ctp:action:useJailCard',
  ACTION_END_TURN = 'ctp:action:endTurn',
  ACTION_SURRENDER = 'ctp:action:surrender',

  // Chat
  CHAT_SEND = 'ctp:chat:send',
  CHAT_MESSAGE = 'ctp:chat:message',

  // Reconnect
  PLAYER_RECONNECT = 'ctp:player:reconnect',
}

// ── Payloads ──────────────────────────────────
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

export interface BuildPayload {
  roomId: string;
  tileIndex: number;
  action: 'build' | 'sell';
}

export interface MortgagePayload {
  roomId: string;
  tileIndex: number;
  action: 'mortgage' | 'unmortgage';
}

export interface SellPropertyPayload {
  roomId: string;
  tileIndex: number;
}

export interface ChatPayload {
  roomId: string;
  message: string;
}

// ── Constants ───────────────────────────────────
export const STARTING_MONEY = 15_000_000; // 15 triệu VNĐ
export const GO_SALARY = 2_000_000; // Lương qua GO: 2 triệu
export const JAIL_FINE = 2_000_000; // Tiền chuộc ra tù: 2 triệu
export const JAIL_POSITION = 10;
export const GO_TO_JAIL_POSITION = 30;
export const MORTGAGE_RATE = 0.5; // Thế chấp = 50% giá mua
export const UNMORTGAGE_RATE = 0.55; // Chuộc lại = 55% giá mua
export const SELL_BUILDING_RATE = 0.5; // Bán nhà = 50% giá xây
export const MAX_JAIL_TURNS = 3; // Tối đa 3 lượt ngồi tù
