// ============================================
// Shared Types — Game Ma Sói (Werewolf)
// ============================================

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

/** Tất cả vai trò trong game */
export enum RoleId {
  // ── Phe Làng ──────────────────────────────
  VILLAGER = 'villager', // Dân Làng — không có năng lực
  SEER = 'seer', // Tiên Tri — mỗi đêm kiểm tra 1 người: dân/sói
  DOCTOR = 'doctor', // Thầy Thuốc — mỗi đêm cứu 1 người (kể cả bản thân, nhưng không 2 đêm liên tiếp)
  HUNTER = 'hunter', // Thợ Săn — khi bị loại, ngay lập tức bắn chết 1 người
  WITCH = 'witch', // Phù Thủy — có 1 thuốc cứu + 1 thuốc độc, mỗi loại dùng 1 lần cả ván
  BODYGUARD = 'bodyguard', // Vệ Sĩ — mỗi đêm bảo vệ 1 người, không thể bảo vệ cùng 1 người 2 đêm liên tiếp
  ELDER = 'elder', // Trưởng Làng — sống sót sau lần bỏ phiếu đầu tiên bị loại, lần 2 mới chết
  DETECTIVE = 'detective', // Thám Tử — kiểm tra xem 2 người có cùng phe không (không biết cụ thể là phe nào)
  LITTLE_RED = 'little_red', // Cô Bé Quàng Khăn Đỏ — nếu Thầy Thuốc chết, nhận năng lực Tiên Tri
  WILD_CHILD = 'wild_child', // Đứa Trẻ Hoang Dã — chọn 1 idol đầu ván; nếu idol chết, đứa trẻ trở thành Ma Sói
  CUPID = 'cupid', // Thần Tình Ái — đêm đầu tiên chọn 1 cặp tình nhân; nếu 1 người chết, người kia cũng chết
  SERVANT = 'servant', // Người Hầu Trung Thành — khi Trưởng Làng bị loại, ngay lập tức nhận vai trò đó
  MAYOR = 'mayor', // Thị Trưởng — phiếu bầu của Thị Trưởng có giá trị gấp đôi
  MEDIUM = 'medium', // Đồng Cốt — mỗi ngày có thể hỏi 1 câu hỏi Yes/No cho 1 người đã chết
  KNIGHT = 'knight', // Hiệp Sĩ — nếu Ma Sói giết Hiệp Sĩ, con sói đó bị thương và không thể giết đêm tiếp theo

  // ── Phe Ma Sói ─────────────────────────────
  WEREWOLF = 'werewolf', // Ma Sói — mỗi đêm chọn 1 người để giết
  ALPHA_WOLF = 'alpha_wolf', // Sói Già — thay vì giết, một lần trong ván có thể biến 1 Dân Làng thành Ma Sói
  WOLF_CUB = 'wolf_cub', // Sói Con — nếu bị loại vào ban ngày, đêm tiếp theo đàn sói được giết 2 người
  CURSED_VILLAGER = 'cursed_villager', // Dân Làng Bị Nguyền — bắt đầu là dân, nếu Ma Sói chọn giết thì thành Ma Sói thay vì chết

  // ── Phe Độc Lập ────────────────────────────
  JESTER = 'jester', // Kẻ Phá Đám — thắng nếu BỊ bỏ phiếu loại vào ban ngày (không tính bị sói giết)
  WHITE_WOLF = 'white_wolf', // Sói Trắng — trong đàn sói nhưng thắng một mình; mỗi 2 đêm có thể giết 1 sói khác
  SERIAL_KILLER = 'serial_killer', // Kẻ Giết Người Hàng Loạt — mỗi đêm giết 1 người, miễn nhiễm với Phù Thủy, thắng khi còn lại 1 mình
  FOX = 'fox', // Cáo — mỗi đêm kiểm tra nhóm 3 người liền kề: nếu có ≥1 sói, nhận tín hiệu; nếu không có hep, mất năng lực
}

/** Phe thắng */
export enum Team {
  VILLAGE = 'village',
  WEREWOLF = 'werewolf',
  LOVERS = 'lovers', // Cặp tình nhân thắng riêng nếu là 2 người cuối còn lại
  JESTER = 'jester',
  WHITE_WOLF = 'white_wolf',
  SERIAL_KILLER = 'serial_killer',
  NONE = 'none', // Chưa xác định (đang chơi)
}

/** Trạng thái ván đấu */
export enum GamePhase {
  WAITING = 'waiting', // Phòng chờ
  NIGHT_START = 'night_start', // Bắt đầu đêm (thông báo)
  NIGHT_CUPID = 'night_cupid', // Đêm đầu: Cupid chọn tình nhân
  NIGHT_WILD_CHILD = 'night_wild_child', // Đêm đầu: Đứa Trẻ chọn idol
  NIGHT_WOLF = 'night_wolf', // Sói chọn mục tiêu
  NIGHT_ALPHA = 'night_alpha', // Sói Già dùng năng lực (nếu muốn)
  NIGHT_SEER = 'night_seer', // Tiên Tri kiểm tra
  NIGHT_DETECTIVE = 'night_detective', // Thám Tử kiểm tra 2 người cùng phe không
  NIGHT_DOCTOR = 'night_doctor', // Thầy Thuốc cứu
  NIGHT_BODYGUARD = 'night_bodyguard', // Vệ Sĩ bảo vệ
  NIGHT_WITCH = 'night_witch', // Phù Thủy dùng thuốc
  NIGHT_FOX = 'night_fox', // Cáo kiểm tra
  NIGHT_SERIAL_KILLER = 'night_serial_killer', // Kẻ Giết Người hành động
  NIGHT_WHITE_WOLF = 'night_white_wolf', // Sói Trắng hành động (mỗi 2 đêm)
  NIGHT_MEDIUM = 'night_medium', // Đồng Cốt giao tiếp
  DAY_REVEAL = 'day_reveal', // Công bố kết quả đêm qua
  DAY_DISCUSSION = 'day_discussion', // Thảo luận ban ngày
  DAY_VOTE = 'day_vote', // Bỏ phiếu loại người
  DAY_VOTE_RESULT = 'day_vote_result', // Kết quả bỏ phiếu
  HUNTER_SHOT = 'hunter_shot', // Thợ Săn bắn (sau khi bị loại)
  GAME_OVER = 'game_over', // Kết thúc
}

/** Trạng thái người chơi */
export enum PlayerStatus {
  ALIVE = 'alive',
  DEAD = 'dead',
  DISCONNECTED = 'disconnected',
}

/** Sự kiện Socket */
export enum MaSoiSocketEvent {
  // Room
  ROOM_LIST = 'ms:room_list',
  ROOM_CREATE = 'ms:room_create',
  ROOM_JOIN = 'ms:room_join',
  ROOM_LEAVE = 'ms:room_leave',
  ROOM_UPDATE = 'ms:room_update',
  ROOM_ERROR = 'ms:room_error',
  ROOM_KICK = 'ms:room_kick',

  // Game setup
  GAME_CONFIG_UPDATE = 'ms:config_update', // Host cập nhật danh sách vai trò và tuỳ chọn
  GAME_START = 'ms:game_start',
  GAME_STATE = 'ms:game_state',
  GAME_PHASE_CHANGE = 'ms:phase_change',

  // Player actions
  PLAYER_RECONNECT = 'ms:player_reconnect',
  NIGHT_ACTION = 'ms:night_action', // Hành động đêm (giết/cứu/kiểm tra/v.v.)
  DAY_VOTE = 'ms:day_vote', // Bỏ phiếu loại người
  DAY_UNVOTE = 'ms:day_unvote', // Rút phiếu
  HUNTER_SHOOT = 'ms:hunter_shoot', // Thợ Săn bắn
  WITCH_USE = 'ms:witch_use', // Phù Thủy dùng thuốc

  // Events broadcast
  GAME_OVER = 'ms:game_over',
  PLAYER_DIED = 'ms:player_died', // Người bị loại (kèm vai trò nếu cần)
  ROLE_REVEAL = 'ms:role_reveal', // Lộ vai trò khi chết (tuỳ cài đặt)
  NIGHT_RESULT = 'ms:night_result', // Kết quả đêm (ai chết, ai được cứu...)
  SEER_RESULT = 'ms:seer_result', // Kết quả tiên tri (chỉ gửi cho Tiên Tri)
  DETECTIVE_RESULT = 'ms:detective_result', // Kết quả thám tử
  FOX_RESULT = 'ms:fox_result',
  VOTE_UPDATE = 'ms:vote_update', // Cập nhật bảng phiếu realtime
  DISCUSSION_READY = 'ms:discussion_ready', // Client báo sẵn sàng bỏ phiếu
  DISCUSSION_READY_UPDATE = 'ms:disc_ready_update', // Server broadcast danh sách sẵn sàng
  SKIP_DISCUSSION = 'ms:skip_discussion', // Host bỏ qua thảo luận
  CHAT_SEND = 'ms:chat_send',
  CHAT_MESSAGE = 'ms:chat_message',
  WOLF_CHAT_SEND = 'ms:wolf_chat_send', // Chat nội bộ phe sói (đêm)
  WOLF_CHAT_MESSAGE = 'ms:wolf_chat_message',
  DEAD_CHAT_SEND = 'ms:dead_chat_send', // Chat người chết (chỉ thấy nhau)
  DEAD_CHAT_MESSAGE = 'ms:dead_chat_message',
  PHASE_TIMER = 'ms:phase_timer', // Đếm ngược thời gian mỗi phase
}

// ─────────────────────────────────────────────
// ROLE DEFINITIONS (metadata)
// ─────────────────────────────────────────────

export interface RoleDef {
  id: RoleId;
  name: string; // Tên hiển thị
  team: Team; // Phe mặc định
  emoji: string;
  color: string; // Màu chủ đề
  image: string; // Đường dẫn ảnh: /assets/ma-soi/roles/<file>
  description: string; // Mô tả đầy đủ
  ability: string; // Năng lực ngắn gọn
  winCondition: string; // Điều kiện thắng
  minPlayers: number; // Số người tối thiểu để dùng vai trò này
  isToggleable: boolean; // Host có thể bật/tắt không
  isUnique: boolean; // Chỉ có 1 trong ván không (false = có thể thêm nhiều)
  tier: 'basic' | 'standard' | 'advanced'; // Mức độ phức tạp
}

export const ROLE_DEFS: Record<RoleId, RoleDef> = {
  // ── Phe Làng ────────────────────────────────────────────────
  [RoleId.VILLAGER]: {
    id: RoleId.VILLAGER,
    name: 'Dân Làng',
    team: Team.VILLAGE,
    emoji: '👨‍🌾',
    color: '#22c55e',
    image: '/assets/ma-soi/roles/villager.png',
    description:
      'Một người dân bình thường. Không có năng lực đặc biệt, nhưng lá phiếu của bạn rất quan trọng để tìm ra Ma Sói.',
    ability: 'Không có năng lực đặc biệt.',
    winCondition: 'Tiêu diệt toàn bộ Ma Sói và các phe đe dọa làng.',
    minPlayers: 3,
    isToggleable: false,
    isUnique: false,
    tier: 'basic',
  },
  [RoleId.SEER]: {
    id: RoleId.SEER,
    name: 'Tiên Tri',
    team: Team.VILLAGE,
    emoji: '🔮',
    color: '#818cf8',
    image: '/assets/ma-soi/roles/seer.png',
    description:
      'Mỗi đêm, Tiên Tri được nhìn thấy lai lịch thật sự của 1 người chơi — thuộc phe Làng hay phe Sói.',
    ability: 'Mỗi đêm: Kiểm tra 1 người → nhận kết quả "Làng" hoặc "Sói".',
    winCondition: 'Tiêu diệt toàn bộ Ma Sói.',
    minPlayers: 5,
    isToggleable: true,
    isUnique: true,
    tier: 'basic',
  },
  [RoleId.DOCTOR]: {
    id: RoleId.DOCTOR,
    name: 'Thầy Thuốc',
    team: Team.VILLAGE,
    emoji: '💊',
    color: '#34d399',
    image: '/assets/ma-soi/roles/doctor.png',
    description:
      'Mỗi đêm, Thầy Thuốc chọn 1 người để bảo vệ. Nếu người đó bị sói giết đêm nay, họ sẽ được cứu. Không thể cứu cùng 1 người 2 đêm liên tiếp.',
    ability: 'Mỗi đêm: Cứu 1 người (không trùng đêm trước).',
    winCondition: 'Tiêu diệt toàn bộ Ma Sói.',
    minPlayers: 6,
    isToggleable: true,
    isUnique: true,
    tier: 'basic',
  },
  [RoleId.HUNTER]: {
    id: RoleId.HUNTER,
    name: 'Thợ Săn',
    team: Team.VILLAGE,
    emoji: '🏹',
    color: '#fb923c',
    image: '/assets/ma-soi/roles/hunter.png',
    description:
      'Khi bị loại bằng bất kỳ cách nào (bỏ phiếu hoặc bị sói giết), Thợ Săn ngay lập tức bắn chết 1 người tùy chọn.',
    ability: 'Khi chết: Bắn chết 1 người bất kỳ ngay lập tức.',
    winCondition: 'Tiêu diệt toàn bộ Ma Sói.',
    minPlayers: 6,
    isToggleable: true,
    isUnique: true,
    tier: 'standard',
  },
  [RoleId.WITCH]: {
    id: RoleId.WITCH,
    name: 'Phù Thủy',
    team: Team.VILLAGE,
    emoji: '🧪',
    color: '#c084fc',
    image: '/assets/ma-soi/roles/witch.png',
    description:
      'Phù Thủy có 2 lọ thuốc dùng 1 lần trong ván: thuốc cứu (cứu người bị sói giết đêm nay) và thuốc độc (giết 1 người bất kỳ). Phù Thủy biết ai bị giết trước khi quyết định.',
    ability: 'Mỗi ván: 1 thuốc cứu + 1 thuốc độc. Mỗi đêm dùng tối đa 1 loại.',
    winCondition: 'Tiêu diệt toàn bộ Ma Sói.',
    minPlayers: 7,
    isToggleable: true,
    isUnique: true,
    tier: 'standard',
  },
  [RoleId.BODYGUARD]: {
    id: RoleId.BODYGUARD,
    name: 'Vệ Sĩ',
    team: Team.VILLAGE,
    emoji: '🛡️',
    color: '#60a5fa',
    image: '/assets/ma-soi/roles/bodyguard.png',
    description:
      'Mỗi đêm bảo vệ 1 người. Nếu người đó bị sói giết, Vệ Sĩ chết thay. Không thể bảo vệ cùng 1 người 2 đêm liên tiếp.',
    ability: 'Mỗi đêm: Bảo vệ 1 người, nếu họ bị giết thì Vệ Sĩ chết thay.',
    winCondition: 'Tiêu diệt toàn bộ Ma Sói.',
    minPlayers: 8,
    isToggleable: true,
    isUnique: true,
    tier: 'standard',
  },
  [RoleId.ELDER]: {
    id: RoleId.ELDER,
    name: 'Trưởng Làng',
    team: Team.VILLAGE,
    emoji: '👴',
    color: '#fbbf24',
    image: '/assets/ma-soi/roles/elder.png',
    description:
      'Trưởng Làng có 2 mạng trong bỏ phiếu ban ngày. Lần đầu bị đa số bầu, họ chỉ "ngất" và mất năng lực đặc biệt (nếu có). Lần thứ 2 mới thực sự chết. Tuy nhiên, nếu bị sói giết ban đêm, chết ngay.',
    ability: '2 mạng trong ngày (lần đầu bị bầu chỉ mất năng lực, không chết).',
    winCondition: 'Tiêu diệt toàn bộ Ma Sói.',
    minPlayers: 8,
    isToggleable: true,
    isUnique: true,
    tier: 'advanced',
  },
  [RoleId.DETECTIVE]: {
    id: RoleId.DETECTIVE,
    name: 'Thám Tử',
    team: Team.VILLAGE,
    emoji: '🔍',
    color: '#94a3b8',
    image: '/assets/ma-soi/roles/detective.png',
    description:
      'Mỗi đêm, Thám Tử chọn 2 người để so sánh. Kết quả cho biết họ có cùng phe không (Làng vs Sói), nhưng không tiết lộ vai trò cụ thể. Lưu ý: các phe Độc Lập (Jester, Serial Killer...) được coi là "cùng phe" với nhau.',
    ability: 'Mỗi đêm: So sánh 2 người → "Cùng phe" hoặc "Khác phe".',
    winCondition: 'Tiêu diệt toàn bộ Ma Sói.',
    minPlayers: 8,
    isToggleable: true,
    isUnique: true,
    tier: 'advanced',
  },
  [RoleId.LITTLE_RED]: {
    id: RoleId.LITTLE_RED,
    name: 'Cô Bé Quàng Khăn Đỏ',
    team: Team.VILLAGE,
    emoji: '🧣',
    color: '#f87171',
    image: '/assets/ma-soi/roles/little_red.png',
    description:
      'Cô Bé Quàng Khăn bình thường như Dân Làng. Nhưng nếu Thầy Thuốc chết (bất kỳ lý do gì), Cô Bé kế thừa năng lực Tiên Tri từ đêm tiếp theo.',
    ability: 'Khi Thầy Thuốc chết: Nhận năng lực Tiên Tri.',
    winCondition: 'Tiêu diệt toàn bộ Ma Sói.',
    minPlayers: 9,
    isToggleable: true,
    isUnique: true,
    tier: 'advanced',
  },
  [RoleId.WILD_CHILD]: {
    id: RoleId.WILD_CHILD,
    name: 'Đứa Trẻ Hoang Dã',
    team: Team.VILLAGE,
    emoji: '🐾',
    color: '#a78bfa',
    image: '/assets/ma-soi/roles/wild_child.png',
    description:
      'Đêm đầu tiên, Đứa Trẻ bí mật chọn 1 người làm "thần tượng". Nếu thần tượng chết, Đứa Trẻ nổi điên và biến thành Ma Sói, gia nhập đàn sói.',
    ability: 'Đêm 1: Chọn idol. Nếu idol chết → trở thành Ma Sói.',
    winCondition:
      'Nếu còn là Dân: Tiêu diệt Ma Sói. Nếu đã thành Sói: Thắng cùng Sói.',
    minPlayers: 9,
    isToggleable: true,
    isUnique: true,
    tier: 'advanced',
  },
  [RoleId.CUPID]: {
    id: RoleId.CUPID,
    name: 'Thần Tình Ái',
    team: Team.VILLAGE,
    emoji: '💘',
    color: '#f472b6',
    image: '/assets/ma-soi/roles/cupid.png',
    description:
      'Đêm đầu tiên, Cupid bắn mũi tên tình yêu vào 2 người (có thể là bản thân). Hai người này trở thành "Tình Nhân" — nếu 1 người chết, người kia ngay lập tức chết theo. Nếu 2 tình nhân là 2 người cuối còn sống (1 Dân + 1 Sói), họ thắng chung.',
    ability: 'Đêm 1: Tạo 1 cặp tình nhân. Nếu 1 chết → người kia chết theo.',
    winCondition: 'Tiêu diệt Ma Sói HOẶC là cặp tình nhân cuối cùng còn sống.',
    minPlayers: 8,
    isToggleable: true,
    isUnique: true,
    tier: 'advanced',
  },
  [RoleId.SERVANT]: {
    id: RoleId.SERVANT,
    name: 'Người Hầu Trung Thành',
    team: Team.VILLAGE,
    emoji: '🙇',
    color: '#86efac',
    image: '/assets/ma-soi/roles/servant.png',
    description:
      'Người Hầu tận tụy bảo vệ Trưởng Làng. Khi Trưởng Làng bị bỏ phiếu loại, Người Hầu ngay lập tức đứng ra thế chỗ và nhận toàn bộ vai trò + năng lực của Trưởng Làng. Trưởng Làng được an toàn.',
    ability: 'Khi Trưởng Làng bị loại: Nhận vai Trưởng Làng, Trưởng Làng sống.',
    winCondition: 'Tiêu diệt toàn bộ Ma Sói.',
    minPlayers: 10,
    isToggleable: true,
    isUnique: true,
    tier: 'advanced',
  },
  [RoleId.MAYOR]: {
    id: RoleId.MAYOR,
    name: 'Thị Trưởng',
    team: Team.VILLAGE,
    emoji: '🏅',
    color: '#facc15',
    image: '/assets/ma-soi/roles/mayor.png',
    description:
      'Thị Trưởng công khai danh tính của mình ngay đầu ván. Phiếu bầu của Thị Trưởng tính gấp đôi trong mỗi cuộc bỏ phiếu. Vì vị thế nổi bật, Thị Trưởng là mục tiêu ưu tiên của đàn sói.',
    ability: 'Phiếu bầu gấp đôi. Phải công khai danh tính.',
    winCondition: 'Tiêu diệt toàn bộ Ma Sói.',
    minPlayers: 8,
    isToggleable: true,
    isUnique: true,
    tier: 'standard',
  },
  [RoleId.MEDIUM]: {
    id: RoleId.MEDIUM,
    name: 'Đồng Cốt',
    team: Team.VILLAGE,
    emoji: '👻',
    color: '#c4b5fd',
    image: '/assets/ma-soi/roles/medium.png',
    description:
      'Mỗi ngày thảo luận, Đồng Cốt có thể giao tiếp với 1 người đã chết, đặt câu hỏi Yes/No. Người chết trả lời thật sự. Chỉ Đồng Cốt nhìn thấy câu trả lời.',
    ability: 'Mỗi ngày: Hỏi 1 người chết 1 câu Yes/No.',
    winCondition: 'Tiêu diệt toàn bộ Ma Sói.',
    minPlayers: 9,
    isToggleable: true,
    isUnique: true,
    tier: 'advanced',
  },
  [RoleId.KNIGHT]: {
    id: RoleId.KNIGHT,
    name: 'Hiệp Sĩ',
    team: Team.VILLAGE,
    emoji: '⚔️',
    color: '#7dd3fc',
    image: '/assets/ma-soi/roles/knight.png',
    description:
      'Hiệp Sĩ là chiến binh dũng cảm. Nếu Ma Sói chọn giết Hiệp Sĩ, Hiệp Sĩ vẫn chết, nhưng con sói đó bị thương nặng và không thể tham gia giết đêm tiếp theo.',
    ability: 'Khi bị sói giết: Con sói đó không thể giết đêm sau.',
    winCondition: 'Tiêu diệt toàn bộ Ma Sói.',
    minPlayers: 8,
    isToggleable: true,
    isUnique: true,
    tier: 'advanced',
  },

  // ── Phe Ma Sói ──────────────────────────────────────────────
  [RoleId.WEREWOLF]: {
    id: RoleId.WEREWOLF,
    name: 'Ma Sói',
    team: Team.WEREWOLF,
    emoji: '🐺',
    color: '#ef4444',
    image: '/assets/ma-soi/roles/werewolf.png',
    description:
      'Ma Sói biết danh tính của mọi con sói khác. Mỗi đêm, các sói bàn nhau qua wolf-chat bí mật và chọn 1 người để giết.',
    ability: 'Mỗi đêm: Biết tên đồng đội, cùng chọn 1 người giết.',
    winCondition: 'Số Ma Sói ≥ số Dân Làng còn sống.',
    minPlayers: 3,
    isToggleable: false,
    isUnique: false,
    tier: 'basic',
  },
  [RoleId.ALPHA_WOLF]: {
    id: RoleId.ALPHA_WOLF,
    name: 'Sói Già',
    team: Team.WEREWOLF,
    emoji: '🐺💀',
    color: '#dc2626',
    image: '/assets/ma-soi/roles/alpha_wolf.png',
    description:
      'Sói Già là thủ lĩnh của đàn. Một lần trong ván, thay vì giết, Sói Già có thể "nguyền" 1 Dân Làng — người đó chuyển sang phe Sói và biết danh tính phe sói từ đêm tiếp theo.',
    ability: '1 lần/ván: Chuyển 1 Dân Làng thành Ma Sói thay vì giết.',
    winCondition: 'Số Ma Sói ≥ số Dân Làng còn sống.',
    minPlayers: 9,
    isToggleable: true,
    isUnique: true,
    tier: 'advanced',
  },
  [RoleId.WOLF_CUB]: {
    id: RoleId.WOLF_CUB,
    name: 'Sói Con',
    team: Team.WEREWOLF,
    emoji: '🐺🍼',
    color: '#f87171',
    image: '/assets/ma-soi/roles/wolf_cub.png',
    description:
      'Sói Con bình thường như Ma Sói. Nhưng nếu bị làng bỏ phiếu loại vào ban ngày, cả đàn sói nổi giận và được phép giết 2 người thay vì 1 vào đêm tiếp theo.',
    ability: 'Nếu bị bầu chết ban ngày: Đàn sói giết 2 người đêm sau.',
    winCondition: 'Số Ma Sói ≥ số Dân Làng còn sống.',
    minPlayers: 9,
    isToggleable: true,
    isUnique: true,
    tier: 'advanced',
  },
  [RoleId.CURSED_VILLAGER]: {
    id: RoleId.CURSED_VILLAGER,
    name: 'Dân Làng Bị Nguyền',
    team: Team.VILLAGE, // Bắt đầu là Làng, chuyển Sói khi bị tấn công
    emoji: '🤒',
    color: '#b45309',
    image: '/assets/ma-soi/roles/cursed_villager.png',
    description:
      'Trông như Dân Làng bình thường, kể cả với Tiên Tri (kết quả là "Làng"). Nhưng nếu Ma Sói chọn tấn công Dân Làng Bị Nguyền, thay vì chết, người này biến thành Ma Sói và gia nhập đàn sói từ đêm tiếp theo.',
    ability:
      'Nếu sói tấn công: Trở thành Ma Sói thay vì chết. Tiên Tri thấy là "Làng".',
    winCondition:
      'Nếu chưa chuyển: Tiêu diệt Ma Sói. Nếu đã là Sói: Thắng cùng Sói.',
    minPlayers: 9,
    isToggleable: true,
    isUnique: true,
    tier: 'advanced',
  },

  // ── Phe Độc Lập ─────────────────────────────────────────────
  [RoleId.JESTER]: {
    id: RoleId.JESTER,
    name: 'Kẻ Phá Đám',
    team: Team.JESTER,
    emoji: '🃏',
    color: '#a855f7',
    image: '/assets/ma-soi/roles/jester.png',
    description:
      'Kẻ Phá Đám thắng bằng cách bị làng bỏ phiếu loại vào ban ngày. Hắn phải tỏ ra đáng nghi ngờ thật khéo léo! Nếu bị sói giết ban đêm thì thua.',
    ability: 'Thắng nếu BỊ bầu loại ban ngày. Thua nếu bị sói giết.',
    winCondition: 'Trở thành người bị bỏ phiếu loại vào ban ngày.',
    minPlayers: 8,
    isToggleable: true,
    isUnique: true,
    tier: 'advanced',
  },
  [RoleId.WHITE_WOLF]: {
    id: RoleId.WHITE_WOLF,
    name: 'Sói Trắng',
    team: Team.WHITE_WOLF,
    emoji: '🤍🐺',
    color: '#e2e8f0',
    image: '/assets/ma-soi/roles/white_wolf.png',
    description:
      'Sói Trắng hoàn toàn trong đàn sói và biết đồng đội. Nhưng hắn muốn chiến thắng một mình. Mỗi 2 đêm (đêm 2, 4, 6...), sau pha hành động của đàn sói, Sói Trắng có thể tùy chọn giết thêm 1 con sói khác.',
    ability: 'Mỗi 2 đêm: Có thể giết 1 sói khác (tùy chọn).',
    winCondition: 'Là người sống sót DUY NHẤT.',
    minPlayers: 12,
    isToggleable: true,
    isUnique: true,
    tier: 'advanced',
  },
  [RoleId.SERIAL_KILLER]: {
    id: RoleId.SERIAL_KILLER,
    name: 'Kẻ Giết Người Hàng Loạt',
    team: Team.SERIAL_KILLER,
    emoji: '🔪',
    color: '#475569',
    image: '/assets/ma-soi/roles/serial_killer.png',
    description:
      'Hoàn toàn độc lập, không theo phe nào. Mỗi đêm giết 1 người. Miễn nhiễm hoàn toàn với thuốc độc của Phù Thủy. Nếu Thợ Săn bắn hắn, hắn có thể bắn lại. Mục tiêu: là người duy nhất sống sót.',
    ability: 'Mỗi đêm: Giết 1 người. Miễn nhiễm Phù Thủy.',
    winCondition: 'Là người sống sót DUY NHẤT.',
    minPlayers: 10,
    isToggleable: true,
    isUnique: true,
    tier: 'advanced',
  },
  [RoleId.FOX]: {
    id: RoleId.FOX,
    name: 'Cáo',
    team: Team.VILLAGE,
    emoji: '🦊',
    color: '#f97316',
    image: '/assets/ma-soi/roles/fox.png',
    description:
      'Cáo mỗi đêm ngửi mùi 3 người liền kề nhau. Nếu trong nhóm đó có ít nhất 1 Ma Sói, Cáo nhận tín hiệu. Nếu hoàn toàn trong sạch, Cáo mất năng lực vĩnh viễn (nhưng không bị chết).',
    ability:
      'Mỗi đêm: Kiểm tra 3 người liền kề → "Có sói" / "Không có sói" (nếu sai → mất năng lực).',
    winCondition: 'Tiêu diệt toàn bộ Ma Sói.',
    minPlayers: 8,
    isToggleable: true,
    isUnique: true,
    tier: 'advanced',
  },
};

// ─────────────────────────────────────────────
// GAME CONFIG
// ─────────────────────────────────────────────

/** Cấu hình ván đấu do host thiết lập */
export interface GameConfig {
  /** Danh sách vai trò được bật (luôn bao gồm VILLAGER và WEREWOLF) */
  enabledRoles: RoleId[];

  /** Số lượng mỗi vai trò (key = RoleId, value = số lượng thẻ) */
  roleCounts: Partial<Record<RoleId, number>>;

  /** Thời gian thảo luận ban ngày (giây) */
  discussionTime: number; // default: 120

  /** Thời gian bỏ phiếu (giây) */
  voteTime: number; // default: 30

  /** Thời gian hành động đêm (giây) */
  nightActionTime: number; // default: 30

  /** Lộ vai trò khi chết không? */
  revealRoleOnDeath: boolean; // default: true

  /** Người chết có thể chat không? */
  deadCanChat: boolean; // default: false

  /** Cho phép Thợ Săn bắn khi bị sói giết ban đêm không? (mặc định chỉ khi ban ngày) */
  hunterShootsOnNightDeath: boolean; // default: false

  /** Cho phép Phù Thủy cứu bản thân không? */
  witchCanSaveSelf: boolean; // default: true

  /** Cho phép Thầy Thuốc cứu bản thân không? */
  doctorCanSaveSelf: boolean; // default: true

  /** Tốc độ game: slow | normal | fast */
  speed: 'slow' | 'normal' | 'fast';
}

export const DEFAULT_CONFIG: GameConfig = {
  enabledRoles: [RoleId.VILLAGER, RoleId.WEREWOLF, RoleId.SEER, RoleId.DOCTOR],
  roleCounts: {
    [RoleId.VILLAGER]: 4,
    [RoleId.WEREWOLF]: 2,
    [RoleId.SEER]: 1,
    [RoleId.DOCTOR]: 1,
  },
  discussionTime: 120,
  voteTime: 30,
  nightActionTime: 30,
  revealRoleOnDeath: true,
  deadCanChat: false,
  hunterShootsOnNightDeath: false,
  witchCanSaveSelf: true,
  doctorCanSaveSelf: true,
  speed: 'normal',
};

// ─────────────────────────────────────────────
// PLAYER & ROOM
// ─────────────────────────────────────────────

export interface MaSoiPlayer {
  id: string;
  socketId: string;
  name: string;
  avatar: string;
  role: RoleId | null; // null = chưa chia bài
  team: Team; // Phe hiện tại (có thể thay đổi với Wild Child, alpha wolf...)
  status: PlayerStatus;
  isHost: boolean;
  isReady: boolean;

  // Trạng thái in-game
  isProtected: boolean; // Được bảo vệ đêm nay (Doctor/Bodyguard)
  isInjured: boolean; // Hiệp Sĩ phản đòn — không thể giết đêm sau
  elderLives: number; // Trưởng Làng: 2 = còn 2 mạng, 1 = đã mất năng lực
  witchSaveUsed: boolean;
  witchKillUsed: boolean;
  doctorLastSaved: string | null; // id người được Doctor cứu đêm trước
  bodyguardLastProtected: string | null;
  foxActive: boolean; // Cáo còn năng lực không
  alphaWolfUsed: boolean;
  isLoversLink: string | null; // id của tình nhân (nếu có)
  hasShot: boolean; // Thợ Săn đã bắn chưa
  idolId: string | null; // Wild Child's idol
  disconnectTimeout: NodeJS.Timeout | null;
}

export interface MaSoiRoom {
  id: string;
  name: string;
  password?: string;
  hostId: string;
  maxPlayers: number;
  players: MaSoiPlayer[];
  status: 'waiting' | 'playing' | 'finished';
  config: GameConfig;
  gameState: MaSoiGameState | null;
  createdAt: number;
}

// ─────────────────────────────────────────────
// GAME STATE
// ─────────────────────────────────────────────

export interface NightActions {
  wolfTarget: string | null; // Target bị đàn sói chọn
  wolfSecondTarget: string | null; // Sói Con: target thứ 2
  alphaTarget: string | null; // Sói Già muốn chuyển đổi
  seerTarget: string | null;
  doctorTarget: string | null;
  bodyguardTarget: string | null;
  witchSaveUsed: boolean; // Phù Thủy dùng thuốc cứu đêm nay
  witchKillTarget: string | null; // Phù Thủy dùng thuốc độc
  foxTargets: [string, string, string] | null; // 3 người Cáo kiểm tra
  detectiveTargets: [string, string] | null; // 2 người Thám Tử so sánh phe
  serialKillerTarget: string | null;
  whiteWolfTarget: string | null;
  mediumTarget: string | null; // Đồng Cốt hỏi ai
  mediumQuestion: string | null;
  cupidPair: [string, string] | null; // Đêm 1: Cupid chọn cặp
  wildChildIdol: string | null; // Đêm 1: Wild Child chọn idol
  submittedBy: Set<string>; // Ids đã gửi action đêm
}

export interface DayVote {
  voterId: string;
  targetId: string;
}

export interface MaSoiGameState {
  players: MaSoiPlayer[];
  phase: GamePhase;
  round: number; // Số vòng (1 vòng = 1 đêm + 1 ngày)
  nightActions: NightActions;
  votes: DayVote[];
  nightDeaths: string[]; // Ids chết đêm qua
  dayEliminated: string | null; // Id bị bầu loại hôm nay
  currentCard: string | null; // RoleId của người đang hành động (server điều phối)
  log: string[];
  winner: Team | null;
  winnerIds: string[]; // Ids người thắng
  phaseDeadline: number; // timestamp kết thúc phase hiện tại
  phaseTimer: NodeJS.Timeout | null;
  cubRageActive: boolean; // Sói Con bị giết → đêm sau giết 2
  discussionReadyPlayers: string[]; // Ids người chơi đã bấm "Sẵn sàng bỏ phiếu"
}

// ─────────────────────────────────────────────
// CLIENT TYPES (gửi xuống frontend — không include NodeJS types)
// ─────────────────────────────────────────────

export interface ClientMaSoiPlayer {
  id: string;
  name: string;
  avatar: string;
  status: PlayerStatus;
  isHost: boolean;
  isReady: boolean;
  // Role chỉ gửi đến đúng người đó + khi chết (nếu revealRoleOnDeath = true)
  role?: RoleId;
  team?: Team;
  // Thông tin công khai
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
  votes: DayVote[]; // Công khai phiếu bầu theo config
  nightDeaths: string[]; // Ids chết đêm qua (sau khi reveal)
  dayEliminated: string | null;
  log: string[];
  winner: Team | null;
  winnerIds: string[];
  phaseDeadline: number;
  discussionReadyPlayerIds: string[]; // Ids người đã bấm "Sẵn sàng"
  wolfChatEnabled: boolean; // Có cho sói chat không
  // Thông tin cá nhân (server gửi đúng người)
  myRole?: RoleId;
  myTeam?: Team;
  myWolfMates?: string[]; // Ids đồng đội sói (nếu là sói)
  myLoversPartner?: string; // Id tình nhân (nếu có)
  myIdol?: string; // Wild Child's idol
  seerResult?: { targetId: string; team: Team; role: RoleId }; // Kết quả đêm nay
  detectiveResult?: { sameTeam: boolean };
  foxResult?: { hasWolf: boolean } | null;
  mediumAnswer?: boolean | null; // Yes/No từ người chết
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

// ─────────────────────────────────────────────
// SOCKET PAYLOADS
// ─────────────────────────────────────────────

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

export interface NightActionPayload {
  roomId: string;
  actionType: keyof Omit<NightActions, 'submittedBy'>;
  targetId?: string;
  targetIds?: string[];
  usePotion?: 'save' | 'kill' | 'none';
  question?: string;
}

export interface DayVotePayload {
  roomId: string;
  targetId: string | null; // null = rút phiếu
}

export interface HunterShootPayload {
  roomId: string;
  targetId: string;
}

export interface ConfigUpdatePayload {
  enabledRoles?: RoleId[];
  roleCounts?: Partial<Record<RoleId, number>>;
  discussionTime?: number;
  voteTime?: number;
  nightActionTime?: number;
  revealRoleOnDeath?: boolean;
  deadCanChat?: boolean;
  hunterShootsOnNightDeath?: boolean;
  witchCanSaveSelf?: boolean;
  doctorCanSaveSelf?: boolean;
  speed?: 'slow' | 'normal' | 'fast';
}

// ─────────────────────────────────────────────
// RECOMMENDED PRESETS
// ─────────────────────────────────────────────

export interface GamePreset {
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  config: Partial<GameConfig>;
}

export const GAME_PRESETS: GamePreset[] = [
  {
    name: '🌱 Cơ Bản',
    description: 'Dành cho người mới. Chỉ có Dân, Sói, Tiên Tri, Thầy Thuốc.',
    minPlayers: 5,
    maxPlayers: 8,
    config: {
      enabledRoles: [
        RoleId.VILLAGER,
        RoleId.WEREWOLF,
        RoleId.SEER,
        RoleId.DOCTOR,
      ],
      roleCounts: {
        [RoleId.VILLAGER]: 4,
        [RoleId.WEREWOLF]: 2,
        [RoleId.SEER]: 1,
        [RoleId.DOCTOR]: 1,
      },
      discussionTime: 150,
      revealRoleOnDeath: true,
    },
  },
  {
    name: '⚔️ Tiêu Chuẩn',
    description: 'Cân bằng giữa làng và sói, thêm Thợ Săn và Phù Thủy.',
    minPlayers: 8,
    maxPlayers: 12,
    config: {
      enabledRoles: [
        RoleId.VILLAGER,
        RoleId.WEREWOLF,
        RoleId.SEER,
        RoleId.DOCTOR,
        RoleId.HUNTER,
        RoleId.WITCH,
      ],
      roleCounts: {
        [RoleId.VILLAGER]: 5,
        [RoleId.WEREWOLF]: 3,
        [RoleId.SEER]: 1,
        [RoleId.DOCTOR]: 1,
        [RoleId.HUNTER]: 1,
        [RoleId.WITCH]: 1,
      },
      discussionTime: 120,
      revealRoleOnDeath: true,
    },
  },
  {
    name: '🔥 Hỗn Loạn',
    description: 'Nhiều vai trò phức tạp, nhiều phe, không ai tin ai.',
    minPlayers: 12,
    maxPlayers: 20,
    config: {
      enabledRoles: [
        RoleId.VILLAGER,
        RoleId.WEREWOLF,
        RoleId.SEER,
        RoleId.DOCTOR,
        RoleId.HUNTER,
        RoleId.WITCH,
        RoleId.BODYGUARD,
        RoleId.CUPID,
        RoleId.JESTER,
        RoleId.ALPHA_WOLF,
        RoleId.WOLF_CUB,
        RoleId.FOX,
      ],
      roleCounts: {
        [RoleId.VILLAGER]: 5,
        [RoleId.WEREWOLF]: 3,
        [RoleId.SEER]: 1,
        [RoleId.DOCTOR]: 1,
        [RoleId.HUNTER]: 1,
        [RoleId.WITCH]: 1,
        [RoleId.BODYGUARD]: 1,
        [RoleId.CUPID]: 1,
        [RoleId.JESTER]: 1,
        [RoleId.ALPHA_WOLF]: 1,
        [RoleId.WOLF_CUB]: 1,
        [RoleId.FOX]: 1,
      },
      discussionTime: 120,
      revealRoleOnDeath: false,
    },
  },
];

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/** Tính số lượng thẻ tối thiểu theo số người chơi */
export function recommendRoleCounts(
  playerCount: number,
): Partial<Record<RoleId, number>> {
  const wolfCount = Math.max(1, Math.floor(playerCount / 4));
  const villagerCount = playerCount - wolfCount - 2; // trừ Tiên Tri và Thầy Thuốc
  return {
    [RoleId.VILLAGER]: Math.max(1, villagerCount),
    [RoleId.WEREWOLF]: wolfCount,
    [RoleId.SEER]: 1,
    [RoleId.DOCTOR]: playerCount >= 6 ? 1 : 0,
  };
}

/** Kiểm tra thắng thua */
export function checkWinCondition(
  players: MaSoiPlayer[],
  cubRageActive: boolean,
): { winner: Team | null; winnerIds: string[] } {
  const alive = players.filter((p) => p.status === PlayerStatus.ALIVE);
  const aliveWolves = alive.filter((p) => p.team === Team.WEREWOLF);
  const aliveVillagers = alive.filter((p) => p.team === Team.VILLAGE);
  const aliveSerialKillers = alive.filter((p) => p.team === Team.SERIAL_KILLER);
  const aliveWhiteWolves = alive.filter((p) => p.team === Team.WHITE_WOLF);

  // Serial Killer thắng một mình
  if (
    aliveSerialKillers.length > 0 &&
    alive.length === aliveSerialKillers.length
  ) {
    return {
      winner: Team.SERIAL_KILLER,
      winnerIds: aliveSerialKillers.map((p) => p.id),
    };
  }

  // White Wolf thắng một mình
  if (aliveWhiteWolves.length > 0 && alive.length === 1) {
    return {
      winner: Team.WHITE_WOLF,
      winnerIds: aliveWhiteWolves.map((p) => p.id),
    };
  }

  // Cặp tình nhân thắng nếu là 2 người cuối, khác phe
  if (alive.length === 2) {
    const [a, b] = alive;
    if (
      a.isLoversLink === b.id &&
      b.isLoversLink === a.id &&
      a.team !== b.team
    ) {
      return { winner: Team.LOVERS, winnerIds: [a.id, b.id] };
    }
  }

  // Làng thắng khi không còn Ma Sói và không còn Serial Killer
  if (
    aliveWolves.length === 0 &&
    aliveSerialKillers.length === 0 &&
    aliveWhiteWolves.length === 0
  ) {
    return { winner: Team.VILLAGE, winnerIds: aliveVillagers.map((p) => p.id) };
  }

  // Sói thắng khi số sói >= số dân
  if (
    aliveWolves.length >= aliveVillagers.length &&
    aliveSerialKillers.length === 0
  ) {
    return { winner: Team.WEREWOLF, winnerIds: aliveWolves.map((p) => p.id) };
  }

  return { winner: null, winnerIds: [] };
}
