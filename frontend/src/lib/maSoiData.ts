// ============================================================
// Ma Sói — Client-side data & type mirrors
// (mirrors backend types.ts but without NodeJS-specific types)
// ============================================================

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

export enum RoleId {
    VILLAGER = 'villager',
    SEER = 'seer',
    DOCTOR = 'doctor',
    HUNTER = 'hunter',
    WITCH = 'witch',
    BODYGUARD = 'bodyguard',
    ELDER = 'elder',
    DETECTIVE = 'detective',
    LITTLE_RED = 'little_red',
    WILD_CHILD = 'wild_child',
    CUPID = 'cupid',
    SERVANT = 'servant',
    MAYOR = 'mayor',
    MEDIUM = 'medium',
    KNIGHT = 'knight',
    WEREWOLF = 'werewolf',
    ALPHA_WOLF = 'alpha_wolf',
    WOLF_CUB = 'wolf_cub',
    CURSED_VILLAGER = 'cursed_villager',
    JESTER = 'jester',
    WHITE_WOLF = 'white_wolf',
    SERIAL_KILLER = 'serial_killer',
    FOX = 'fox',
}

export enum Team {
    VILLAGE = 'village',
    WEREWOLF = 'werewolf',
    LOVERS = 'lovers',
    JESTER = 'jester',
    WHITE_WOLF = 'white_wolf',
    SERIAL_KILLER = 'serial_killer',
    NONE = 'none',
}

export enum GamePhase {
    WAITING = 'waiting',
    NIGHT_START = 'night_start',
    NIGHT_CUPID = 'night_cupid',
    NIGHT_WILD_CHILD = 'night_wild_child',
    NIGHT_WOLF = 'night_wolf',
    NIGHT_ALPHA = 'night_alpha',
    NIGHT_SEER = 'night_seer',
    NIGHT_DETECTIVE = 'night_detective',
    NIGHT_DOCTOR = 'night_doctor',
    NIGHT_BODYGUARD = 'night_bodyguard',
    NIGHT_WITCH = 'night_witch',
    NIGHT_FOX = 'night_fox',
    NIGHT_SERIAL_KILLER = 'night_serial_killer',
    NIGHT_WHITE_WOLF = 'night_white_wolf',
    NIGHT_MEDIUM = 'night_medium',
    DAY_REVEAL = 'day_reveal',
    DAY_DISCUSSION = 'day_discussion',
    DAY_VOTE = 'day_vote',
    DAY_VOTE_RESULT = 'day_vote_result',
    HUNTER_SHOT = 'hunter_shot',
    GAME_OVER = 'game_over',
}

export enum PlayerStatus {
    ALIVE = 'alive',
    DEAD = 'dead',
    DISCONNECTED = 'disconnected',
}

export enum MaSoiSocketEvent {
    ROOM_LIST = 'ms:room_list',
    ROOM_CREATE = 'ms:room_create',
    ROOM_JOIN = 'ms:room_join',
    ROOM_LEAVE = 'ms:room_leave',
    ROOM_UPDATE = 'ms:room_update',
    ROOM_ERROR = 'ms:room_error',
    ROOM_KICK = 'ms:room_kick',
    GAME_CONFIG_UPDATE = 'ms:config_update',
    GAME_START = 'ms:game_start',
    GAME_STATE = 'ms:game_state',
    GAME_PHASE_CHANGE = 'ms:phase_change',
    PLAYER_RECONNECT = 'ms:player_reconnect',
    NIGHT_ACTION = 'ms:night_action',
    DAY_VOTE = 'ms:day_vote',
    DAY_UNVOTE = 'ms:day_unvote',
    HUNTER_SHOOT = 'ms:hunter_shoot',
    WITCH_USE = 'ms:witch_use',
    GAME_OVER = 'ms:game_over',
    PLAYER_DIED = 'ms:player_died',
    ROLE_REVEAL = 'ms:role_reveal',
    NIGHT_RESULT = 'ms:night_result',
    SEER_RESULT = 'ms:seer_result',
    DETECTIVE_RESULT = 'ms:detective_result',
    FOX_RESULT = 'ms:fox_result',
    VOTE_UPDATE = 'ms:vote_update',
    DISCUSSION_READY = 'ms:discussion_ready',
    DISCUSSION_READY_UPDATE = 'ms:disc_ready_update',
    SKIP_DISCUSSION = 'ms:skip_discussion',
    CHAT_SEND = 'ms:chat_send',
    CHAT_MESSAGE = 'ms:chat_message',
    WOLF_CHAT_SEND = 'ms:wolf_chat_send',
    WOLF_CHAT_MESSAGE = 'ms:wolf_chat_message',
    DEAD_CHAT_SEND = 'ms:dead_chat_send',
    DEAD_CHAT_MESSAGE = 'ms:dead_chat_message',
    PHASE_TIMER = 'ms:phase_timer',
}

// ─────────────────────────────────────────────
// DATA TYPES
// ─────────────────────────────────────────────

export interface DayVote {
    voterId: string;
    targetId: string;
}

export interface ClientMaSoiPlayer {
    id: string;
    name: string;
    avatar: string;
    status: PlayerStatus;
    isHost: boolean;
    isReady: boolean;
    role?: RoleId;
    team?: Team;
    isDisconnected: boolean;
    foxActive?: boolean;
    elderLives?: number;
    witchSaveUsed?: boolean;
    witchKillUsed?: boolean;
}

export interface ClientMaSoiGameState {
    players: ClientMaSoiPlayer[];
    phase: GamePhase;
    round: number;
    votes: DayVote[];
    nightDeaths: string[];
    dayEliminated: string | null;
    log: string[];
    winner: Team | null;
    winnerIds: string[];
    phaseDeadline: number;
    discussionReadyPlayerIds: string[];
    wolfChatEnabled: boolean;
    myRole?: RoleId;
    myTeam?: Team;
    myWolfMates?: string[];
    myLoversPartner?: string;
    myIdol?: string;
    seerResult?: { targetId: string; team: Team; role: RoleId };
    detectiveResult?: { sameTeam: boolean };
    foxResult?: { hasWolf: boolean } | null;
    mediumAnswer?: boolean | null;
}

export interface GameConfig {
    enabledRoles: RoleId[];
    roleCounts: Partial<Record<RoleId, number>>;
    speed: 'normal' | 'fast' | 'slow';
    nightActionTime: number;
    discussionTime: number;
    voteTime: number;
    revealRoleOnDeath: boolean;
    doctorCanSaveSelf: boolean;
    allowSpectators: boolean;
}

export interface ClientMaSoiRoom {
    id: string;
    name: string;
    hasPassword: boolean;
    hostId: string;
    maxPlayers: number;
    players: ClientMaSoiPlayer[];
    status: 'waiting' | 'playing' | 'finished';
    config: GameConfig;
}

export interface ChatMessage {
    playerId: string;
    name: string;
    avatar?: string;
    message: string;
    timestamp: number;
    channel: 'public' | 'wolf' | 'dead';
}

// ─────────────────────────────────────────────
// ROLE DEFINITIONS
// ─────────────────────────────────────────────

export interface RoleDef {
    id: RoleId;
    name: string;
    team: Team;
    emoji: string;
    color: string;
    image: string;
    description: string;
    ability: string;
    minPlayers: number;
    isToggleable: boolean;
    isUnique: boolean;
    tier: 'basic' | 'standard' | 'advanced';
}

export const ROLE_DEFS: Record<RoleId, RoleDef> = {
    [RoleId.VILLAGER]: {
        id: RoleId.VILLAGER, name: 'Dân Làng', team: Team.VILLAGE, emoji: '👨‍🌾',
        color: '#22c55e', image: '/assets/ma-soi/roles/villager.png',
        description: 'Người dân bình thường. Không có năng lực đặc biệt, nhưng lá phiếu của bạn rất quan trọng.',
        ability: 'Không có năng lực đặc biệt.', minPlayers: 3, isToggleable: false, isUnique: false, tier: 'basic',
    },
    [RoleId.SEER]: {
        id: RoleId.SEER, name: 'Tiên Tri', team: Team.VILLAGE, emoji: '🔮',
        color: '#a78bfa', image: '/assets/ma-soi/roles/seer.png',
        description: 'Mỗi đêm, kiểm tra 1 người để biết họ thuộc phe Dân hay phe Sói.',
        ability: 'Kiểm tra 1 người mỗi đêm.', minPlayers: 5, isToggleable: true, isUnique: true, tier: 'basic',
    },
    [RoleId.DOCTOR]: {
        id: RoleId.DOCTOR, name: 'Thầy Thuốc', team: Team.VILLAGE, emoji: '💊',
        color: '#34d399', image: '/assets/ma-soi/roles/doctor.png',
        description: 'Mỗi đêm cứu 1 người (kể cả bản thân). Không thể cứu cùng 1 người 2 đêm liên tiếp.',
        ability: 'Cứu 1 người mỗi đêm.', minPlayers: 5, isToggleable: true, isUnique: true, tier: 'basic',
    },
    [RoleId.HUNTER]: {
        id: RoleId.HUNTER, name: 'Thợ Săn', team: Team.VILLAGE, emoji: '🏹',
        color: '#f59e0b', image: '/assets/ma-soi/roles/hunter.png',
        description: 'Khi bị loại (bất kỳ lý do), ngay lập tức bắn chết 1 người khác.',
        ability: 'Bắn 1 người khi chết.', minPlayers: 6, isToggleable: true, isUnique: true, tier: 'basic',
    },
    [RoleId.WITCH]: {
        id: RoleId.WITCH, name: 'Phù Thủy', team: Team.VILLAGE, emoji: '🧪',
        color: '#c084fc', image: '/assets/ma-soi/roles/witch.png',
        description: 'Có 1 thuốc cứu + 1 thuốc độc. Mỗi loại dùng 1 lần trong ván. Biết ai bị sói chọn.',
        ability: '1 thuốc cứu + 1 thuốc độc (mỗi loại dùng 1 lần).', minPlayers: 6, isToggleable: true, isUnique: true, tier: 'standard',
    },
    [RoleId.BODYGUARD]: {
        id: RoleId.BODYGUARD, name: 'Vệ Sĩ', team: Team.VILLAGE, emoji: '🛡️',
        color: '#60a5fa', image: '/assets/ma-soi/roles/bodyguard.png',
        description: 'Mỗi đêm bảo vệ 1 người. Nếu sói tấn công người đó, vệ sĩ chết thay. Không bảo vệ cùng 1 người 2 đêm liên tiếp.',
        ability: 'Bảo vệ 1 người mỗi đêm (vệ sĩ chết thay).', minPlayers: 7, isToggleable: true, isUnique: true, tier: 'standard',
    },
    [RoleId.ELDER]: {
        id: RoleId.ELDER, name: 'Trưởng Làng', team: Team.VILLAGE, emoji: '👴',
        color: '#fbbf24', image: '/assets/ma-soi/roles/elder.png',
        description: 'Sống sót sau lần bỏ phiếu đầu tiên bị loại (mất năng lực). Lần 2 mới chết.',
        ability: '2 mạng khi bị bỏ phiếu loại.', minPlayers: 7, isToggleable: true, isUnique: true, tier: 'standard',
    },
    [RoleId.DETECTIVE]: {
        id: RoleId.DETECTIVE, name: 'Thám Tử', team: Team.VILLAGE, emoji: '🔍',
        color: '#38bdf8', image: '/assets/ma-soi/roles/detective.png',
        description: 'Mỗi đêm chọn 2 người để biết họ có cùng phe hay không (không biết phe nào cụ thể).',
        ability: 'Kiểm tra 2 người có cùng phe không.', minPlayers: 7, isToggleable: true, isUnique: true, tier: 'standard',
    },
    [RoleId.LITTLE_RED]: {
        id: RoleId.LITTLE_RED, name: 'Cô Bé Quàng Khăn Đỏ', team: Team.VILLAGE, emoji: '🧣',
        color: '#f87171', image: '/assets/ma-soi/roles/little_red.png',
        description: 'Nếu Thầy Thuốc chết, Cô Bé nhận năng lực Tiên Tri từ đêm tiếp theo.',
        ability: 'Kế thừa năng lực Tiên Tri nếu Thầy Thuốc chết.', minPlayers: 8, isToggleable: true, isUnique: true, tier: 'advanced',
    },
    [RoleId.WILD_CHILD]: {
        id: RoleId.WILD_CHILD, name: 'Đứa Trẻ Hoang Dã', team: Team.VILLAGE, emoji: '🐾',
        color: '#4ade80', image: '/assets/ma-soi/roles/wild_child.png',
        description: 'Đêm đầu chọn 1 idol. Nếu idol chết, đứa trẻ trở thành Ma Sói.',
        ability: 'Chọn idol đêm 1; trở thành Ma Sói nếu idol chết.', minPlayers: 8, isToggleable: true, isUnique: true, tier: 'advanced',
    },
    [RoleId.CUPID]: {
        id: RoleId.CUPID, name: 'Thần Tình Ái', team: Team.VILLAGE, emoji: '💘',
        color: '#f472b6', image: '/assets/ma-soi/roles/cupid.png',
        description: 'Đêm đầu chọn 1 cặp tình nhân. Nếu 1 người chết, người kia cũng chết theo.',
        ability: 'Tạo cặp tình nhân đêm 1.', minPlayers: 8, isToggleable: true, isUnique: true, tier: 'advanced',
    },
    [RoleId.SERVANT]: {
        id: RoleId.SERVANT, name: 'Người Hầu Trung Thành', team: Team.VILLAGE, emoji: '🙇',
        color: '#a3a3a3', image: '/assets/ma-soi/roles/servant.png',
        description: 'Khi Trưởng Làng hoặc Thị Trưởng bị loại, Người Hầu đứng ra nhận vai trò đó.',
        ability: 'Kế thừa chức vụ đặc biệt khi người đó chết.', minPlayers: 8, isToggleable: true, isUnique: true, tier: 'advanced',
    },
    [RoleId.MAYOR]: {
        id: RoleId.MAYOR, name: 'Thị Trưởng', team: Team.VILLAGE, emoji: '🏛️',
        color: '#facc15', image: '/assets/ma-soi/roles/mayor.png',
        description: 'Phiếu bầu của Thị Trưởng có giá trị gấp đôi khi bỏ phiếu loại người.',
        ability: 'Phiếu bầu x2.', minPlayers: 6, isToggleable: true, isUnique: true, tier: 'standard',
    },
    [RoleId.MEDIUM]: {
        id: RoleId.MEDIUM, name: 'Đồng Cốt', team: Team.VILLAGE, emoji: '👻',
        color: '#818cf8', image: '/assets/ma-soi/roles/medium.png',
        description: 'Mỗi ngày có thể hỏi 1 câu hỏi Yes/No cho linh hồn 1 người đã chết.',
        ability: 'Hỏi linh hồn người chết 1 câu/ngày.', minPlayers: 8, isToggleable: true, isUnique: true, tier: 'advanced',
    },
    [RoleId.KNIGHT]: {
        id: RoleId.KNIGHT, name: 'Hiệp Sĩ', team: Team.VILLAGE, emoji: '⚔️',
        color: '#94a3b8', image: '/assets/ma-soi/roles/knight.png',
        description: 'Nếu Ma Sói giết Hiệp Sĩ, con sói đó bị thương và không thể giết đêm tiếp theo.',
        ability: 'Phản đòn con sói đã tấn công mình.', minPlayers: 7, isToggleable: true, isUnique: true, tier: 'standard',
    },
    [RoleId.WEREWOLF]: {
        id: RoleId.WEREWOLF, name: 'Ma Sói', team: Team.WEREWOLF, emoji: '🐺',
        color: '#dc2626', image: '/assets/ma-soi/roles/werewolf.png',
        description: 'Mỗi đêm cùng đàn sói chọn 1 người để giết. Biết danh tính đồng đội.',
        ability: 'Giết 1 người mỗi đêm cùng đàn.', minPlayers: 3, isToggleable: false, isUnique: false, tier: 'basic',
    },
    [RoleId.ALPHA_WOLF]: {
        id: RoleId.ALPHA_WOLF, name: 'Sói Già', team: Team.WEREWOLF, emoji: '🐺🦷',
        color: '#991b1b', image: '/assets/ma-soi/roles/alpha_wolf.png',
        description: 'Một lần trong ván có thể chuyển đổi 1 Dân Làng thành Ma Sói thay vì giết.',
        ability: 'Chuyển hóa 1 dân thành sói (1 lần/ván).', minPlayers: 8, isToggleable: true, isUnique: true, tier: 'advanced',
    },
    [RoleId.WOLF_CUB]: {
        id: RoleId.WOLF_CUB, name: 'Sói Con', team: Team.WEREWOLF, emoji: '🐺🍼',
        color: '#b91c1c', image: '/assets/ma-soi/roles/wolf_cub.png',
        description: 'Nếu bị bỏ phiếu loại, đêm tiếp theo đàn sói được giết 2 người.',
        ability: 'Khi chết vì bỏ phiếu, đêm sau sói giết 2 người.', minPlayers: 8, isToggleable: true, isUnique: true, tier: 'advanced',
    },
    [RoleId.CURSED_VILLAGER]: {
        id: RoleId.CURSED_VILLAGER, name: 'Dân Làng Bị Nguyền', team: Team.VILLAGE, emoji: '😈',
        color: '#7f1d1d', image: '/assets/ma-soi/roles/cursed_villager.png',
        description: 'Bắt đầu như dân làng. Nếu sói chọn giết thì bị chuyển thành Ma Sói thay vì chết.',
        ability: 'Bị chuyển thành sói khi sói tấn công.', minPlayers: 7, isToggleable: true, isUnique: true, tier: 'standard',
    },
    [RoleId.JESTER]: {
        id: RoleId.JESTER, name: 'Kẻ Phá Đám', team: Team.JESTER, emoji: '🃏',
        color: '#f97316', image: '/assets/ma-soi/roles/jester.png',
        description: 'Thắng ngay khi bị làng bỏ phiếu loại vào ban ngày (không tính sói giết).',
        ability: 'Thắng khi bị bỏ phiếu loại.', minPlayers: 7, isToggleable: true, isUnique: true, tier: 'advanced',
    },
    [RoleId.WHITE_WOLF]: {
        id: RoleId.WHITE_WOLF, name: 'Sói Trắng', team: Team.WEREWOLF, emoji: '🤍🐺',
        color: '#e2e8f0', image: '/assets/ma-soi/roles/white_wolf.png',
        description: 'Trong đàn sói nhưng thắng 1 mình. Mỗi 2 đêm có thể giết 1 sói khác.',
        ability: 'Mỗi 2 đêm giết 1 sói; thắng khi là sói cuối cùng.', minPlayers: 9, isToggleable: true, isUnique: true, tier: 'advanced',
    },
    [RoleId.SERIAL_KILLER]: {
        id: RoleId.SERIAL_KILLER, name: 'Kẻ Giết Người Hàng Loạt', team: Team.SERIAL_KILLER, emoji: '🔪',
        color: '#1e293b', image: '/assets/ma-soi/roles/serial_killer.png',
        description: 'Mỗi đêm giết 1 người (kể cả sói). Miễn nhiễm thuốc độc. Thắng khi là người cuối cùng.',
        ability: 'Giết 1 người mỗi đêm; miễn nhiễm sói và thuốc độc.', minPlayers: 8, isToggleable: true, isUnique: true, tier: 'advanced',
    },
    [RoleId.FOX]: {
        id: RoleId.FOX, name: 'Cáo', team: Team.VILLAGE, emoji: '🦊',
        color: '#fb923c', image: '/assets/ma-soi/roles/fox.png',
        description: 'Mỗi đêm kiểm tra nhóm 3 người liền kề. Có Ma Sói trong nhóm thì biết. Nếu không thì mất năng lực.',
        ability: 'Dò Ma Sói trong nhóm 3 người; mất năng lực nếu sai.', minPlayers: 8, isToggleable: true, isUnique: true, tier: 'advanced',
    },
};

// ─────────────────────────────────────────────
// NIGHT PHASE DESCRIPTIONS
// ─────────────────────────────────────────────

export const PHASE_INFO: Partial<Record<GamePhase, { title: string; subtitle: string; bg: string }>> = {
    [GamePhase.NIGHT_START]: { title: '🌙 Đêm Xuống', subtitle: 'Cả làng nhắm mắt…', bg: 'night' },
    [GamePhase.NIGHT_CUPID]: { title: '💘 Thần Tình Ái', subtitle: 'Hãy chọn 2 người làm tình nhân.', bg: 'night' },
    [GamePhase.NIGHT_WILD_CHILD]: { title: '🐾 Đứa Trẻ Hoang Dã', subtitle: 'Hãy chọn idol của bạn.', bg: 'night' },
    [GamePhase.NIGHT_WOLF]: { title: '🐺 Đàn Ma Sói', subtitle: 'Hãy chọn nạn nhân đêm nay.', bg: 'night' },
    [GamePhase.NIGHT_ALPHA]: { title: '🐺🦷 Sói Già', subtitle: 'Bạn có muốn chuyển hóa ai không?', bg: 'night' },
    [GamePhase.NIGHT_SEER]: { title: '🔮 Tiên Tri', subtitle: 'Hãy kiểm tra 1 người đêm nay.', bg: 'night' },
    [GamePhase.NIGHT_DETECTIVE]: { title: '🔍 Thám Tử', subtitle: 'Chọn 2 người — họ có cùng phe không?', bg: 'night' },
    [GamePhase.NIGHT_DOCTOR]: { title: '💊 Thầy Thuốc', subtitle: 'Hãy cứu 1 người đêm nay.', bg: 'night' },
    [GamePhase.NIGHT_BODYGUARD]: { title: '🛡️ Vệ Sĩ', subtitle: 'Hãy bảo vệ 1 người đêm nay.', bg: 'night' },
    [GamePhase.NIGHT_WITCH]: { title: '🧪 Phù Thủy', subtitle: 'Bạn có muốn dùng thuốc không?', bg: 'night' },
    [GamePhase.NIGHT_FOX]: { title: '🦊 Cáo', subtitle: 'Kiểm tra nhóm 3 người liền kề.', bg: 'night' },
    [GamePhase.NIGHT_SERIAL_KILLER]: { title: '🔪 Kẻ Giết Người', subtitle: 'Chọn nạn nhân đêm nay.', bg: 'night' },
    [GamePhase.NIGHT_WHITE_WOLF]: { title: '🤍🐺 Sói Trắng', subtitle: 'Bạn có muốn giết 1 đồng loại không?', bg: 'night' },
    [GamePhase.NIGHT_MEDIUM]: { title: '👻 Đồng Cốt', subtitle: 'Bạn muốn hỏi ai?', bg: 'night' },
    [GamePhase.DAY_REVEAL]: { title: '☀️ Bình Minh', subtitle: 'Xem kết quả đêm qua…', bg: 'day' },
    [GamePhase.DAY_DISCUSSION]: { title: '💬 Thảo Luận', subtitle: 'Tìm ra Ma Sói trong số các bạn!', bg: 'day' },
    [GamePhase.DAY_VOTE]: { title: '🗳️ Bỏ Phiếu', subtitle: 'Ai là Ma Sói?', bg: 'voting' },
    [GamePhase.DAY_VOTE_RESULT]: { title: '🔨 Kết Quả', subtitle: 'Phán quyết của làng…', bg: 'day' },
    [GamePhase.HUNTER_SHOT]: { title: '🏹 Thợ Săn', subtitle: 'Hãy bắn 1 người trước khi ngã!', bg: 'day' },
    [GamePhase.GAME_OVER]: { title: '🎉 Kết Thúc', subtitle: 'Trận đấu kết thúc!', bg: 'day' },
};

export const TEAM_LABELS: Record<Team, string> = {
    [Team.VILLAGE]: 'Phe Dân Làng',
    [Team.WEREWOLF]: 'Phe Ma Sói',
    [Team.LOVERS]: 'Đôi Tình Nhân',
    [Team.JESTER]: 'Kẻ Phá Đám',
    [Team.WHITE_WOLF]: 'Sói Trắng',
    [Team.SERIAL_KILLER]: 'Kẻ Giết Người',
    [Team.NONE]: 'Không xác định',
};

export const WIN_BACKGROUND: Record<string, string> = {
    [Team.VILLAGE]: '/assets/ma-soi/backgrounds/game-over-village.jpg',
    [Team.LOVERS]: '/assets/ma-soi/backgrounds/game-over-village.jpg',
    default: '/assets/ma-soi/backgrounds/game-over-wolf.jpg',
};

export const DEFAULT_AVATARS = [
    '/assets/ma-soi/ui/avatars/avatar-1.png',
    '/assets/ma-soi/ui/avatars/avatar-2.png',
    '/assets/ma-soi/ui/avatars/avatar-3.png',
    '/assets/ma-soi/ui/avatars/avatar-4.png',
    '/assets/ma-soi/ui/avatars/avatar-5.png',
    '/assets/ma-soi/ui/avatars/avatar-6.png',
    '/assets/ma-soi/ui/avatars/avatar-7.png',
    '/assets/ma-soi/ui/avatars/avatar-8.png',
];

// ─────────────────────────────────────────────
// PRESETS
// ─────────────────────────────────────────────

export interface GamePreset {
    id: string;
    name: string;
    description: string;
    minPlayers: number;
    maxPlayers: number;
    config: Partial<GameConfig>;
}

export const GAME_PRESETS: GamePreset[] = [
    {
        id: 'basic',
        name: '⚡ Cơ Bản',
        description: 'Dành cho người mới. Chỉ có các vai trò cơ bản.',
        minPlayers: 5,
        maxPlayers: 9,
        config: {
            enabledRoles: [RoleId.VILLAGER, RoleId.WEREWOLF, RoleId.SEER, RoleId.DOCTOR, RoleId.HUNTER],
            speed: 'normal',
        },
    },
    {
        id: 'standard',
        name: '🐺 Tiêu Chuẩn',
        description: 'Phù hợp 8–12 người. Đầy đủ vai trò phổ biến.',
        minPlayers: 8,
        maxPlayers: 14,
        config: {
            enabledRoles: [
                RoleId.VILLAGER, RoleId.WEREWOLF, RoleId.SEER, RoleId.DOCTOR,
                RoleId.HUNTER, RoleId.WITCH, RoleId.MAYOR, RoleId.ELDER,
            ],
            speed: 'normal',
        },
    },
    {
        id: 'chaos',
        name: '🌪️ Hỗn Loạn',
        description: 'Mọi vai trò đặc biệt. Dành cho người chơi nâng cao.',
        minPlayers: 12,
        maxPlayers: 20,
        config: {
            enabledRoles: Object.values(RoleId),
            speed: 'fast',
        },
    },
];

export const DEFAULT_CONFIG: GameConfig = {
    enabledRoles: [
        RoleId.VILLAGER, RoleId.WEREWOLF, RoleId.SEER, RoleId.DOCTOR, RoleId.HUNTER,
    ],
    roleCounts: { [RoleId.VILLAGER]: 3, [RoleId.WEREWOLF]: 2, [RoleId.SEER]: 1, [RoleId.DOCTOR]: 1, [RoleId.HUNTER]: 1 },
    speed: 'normal',
    nightActionTime: 30,
    discussionTime: 120,
    voteTime: 60,
    revealRoleOnDeath: true,
    doctorCanSaveSelf: true,
    allowSpectators: false,
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/** Given a player count N, suggest a balanced role distribution */
export function recommendRoleCounts(n: number): Partial<Record<RoleId, number>> {
    const wolves = Math.max(1, Math.floor(n / 4));
    const special = Math.max(1, Math.floor(n / 5));
    const villagers = n - wolves - Math.min(3, special);
    return {
        [RoleId.WEREWOLF]: wolves,
        [RoleId.SEER]: 1,
        [RoleId.DOCTOR]: special >= 2 ? 1 : 0,
        [RoleId.HUNTER]: special >= 3 ? 1 : 0,
        [RoleId.VILLAGER]: Math.max(1, villagers),
    };
}

export function isNightPhase(phase: GamePhase): boolean {
    return phase.startsWith('night_');
}

export function isDayPhase(phase: GamePhase): boolean {
    return phase.startsWith('day_');
}
