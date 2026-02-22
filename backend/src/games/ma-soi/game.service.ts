import { Injectable } from '@nestjs/common';
import {
    MaSoiRoom,
    MaSoiPlayer,
    MaSoiGameState,
    NightActions,
    DayVote,
    GamePhase,
    RoleId,
    Team,
    PlayerStatus,
    ClientMaSoiGameState,
    ClientMaSoiPlayer,
    GameConfig,
    checkWinCondition,
} from './types.js';

const MAX_LOG = 60;

@Injectable()
export class MaSoiGameService {

    // ════════════════════════════════════════════
    // INITIALIZATION
    // ════════════════════════════════════════════

    initializeGame(room: MaSoiRoom): MaSoiGameState {
        const { config } = room;

        // Build role deck from config
        const deck: RoleId[] = [];
        for (const [roleId, count] of Object.entries(config.roleCounts)) {
            for (let i = 0; i < (count ?? 0); i++) {
                deck.push(roleId as RoleId);
            }
        }

        // Shuffle deck and assign roles
        const shuffled = this.shuffle([...deck]);
        const players = room.players.map((p) => ({ ...p }));

        players.forEach((p, i) => {
            const role = shuffled[i] ?? RoleId.VILLAGER;
            p.role = role;
            p.team = this.getDefaultTeam(role);
            p.status = PlayerStatus.ALIVE;
            p.isProtected = false;
            p.isInjured = false;
            p.elderLives = 2;
            p.witchSaveUsed = false;
            p.witchKillUsed = false;
            p.doctorLastSaved = null;
            p.bodyguardLastProtected = null;
            p.foxActive = true;
            p.alphaWolfUsed = false;
            p.isLoversLink = null;
            p.hasShot = false;
            p.idolId = null;
        });

        room.players = players;
        room.status = 'playing';

        const phaseTimeSec = this.getPhaseTime(config, 'night_action');

        const gs: MaSoiGameState = {
            players,
            phase: GamePhase.NIGHT_START,
            round: 1,
            nightActions: this.emptyNightActions(),
            votes: [],
            nightDeaths: [],
            dayEliminated: null,
            currentCard: null,
            log: ['🌙 Đêm đầu tiên bắt đầu…'],
            winner: null,
            winnerIds: [],
            phaseDeadline: Date.now() + 3000, // 3s transition
            phaseTimer: null,
            cubRageActive: false,
        };

        room.gameState = gs;
        return gs;
    }

    // ════════════════════════════════════════════
    // PHASE MANAGEMENT
    // ════════════════════════════════════════════

    /** Returns the ordered list of night sub-phases active for this config + round */
    getNightPhaseOrder(room: MaSoiRoom): GamePhase[] {
        const { config, gameState: gs } = room;
        if (!gs) return [];

        const phases: GamePhase[] = [];
        const isFirstNight = gs.round === 1;
        const isEnabled = (r: RoleId) =>
            config.enabledRoles.includes(r) &&
            this.hasAliveRole(gs.players, r);

        if (isFirstNight && isEnabled(RoleId.CUPID)) phases.push(GamePhase.NIGHT_CUPID);
        if (isFirstNight && isEnabled(RoleId.WILD_CHILD)) phases.push(GamePhase.NIGHT_WILD_CHILD);
        phases.push(GamePhase.NIGHT_WOLF);
        if (isEnabled(RoleId.ALPHA_WOLF)) phases.push(GamePhase.NIGHT_ALPHA);
        if (isEnabled(RoleId.SEER)) phases.push(GamePhase.NIGHT_SEER);
        if (isEnabled(RoleId.DOCTOR)) phases.push(GamePhase.NIGHT_DOCTOR);
        if (isEnabled(RoleId.BODYGUARD)) phases.push(GamePhase.NIGHT_BODYGUARD);
        if (isEnabled(RoleId.WITCH)) phases.push(GamePhase.NIGHT_WITCH);
        if (isEnabled(RoleId.FOX)) phases.push(GamePhase.NIGHT_FOX);
        if (isEnabled(RoleId.SERIAL_KILLER)) phases.push(GamePhase.NIGHT_SERIAL_KILLER);
        if (
            isEnabled(RoleId.WHITE_WOLF) &&
            gs.round % 2 === 0 // every 2 rounds
        ) phases.push(GamePhase.NIGHT_WHITE_WOLF);
        if (
            isEnabled(RoleId.MEDIUM) &&
            gs.players.some((p) => p.status === PlayerStatus.DEAD)
        ) phases.push(GamePhase.NIGHT_MEDIUM);

        return phases;
    }

    /** Advance to the next sub-phase; returns the new phase */
    advanceNightPhase(room: MaSoiRoom, currentPhase: GamePhase): GamePhase {
        const order = this.getNightPhaseOrder(room);
        const idx = order.indexOf(currentPhase);
        if (idx === -1 || idx === order.length - 1) {
            // All night actions done → resolve and move to day
            return this.resolveNightAndStartDay(room);
        }
        const next = order[idx + 1];
        const gs = room.gameState!;
        gs.phase = next;
        gs.phaseDeadline = Date.now() + this.getPhaseTime(room.config, 'night_action') * 1000;
        return next;
    }

    startNight(room: MaSoiRoom): GamePhase {
        const gs = room.gameState!;
        gs.nightActions = this.emptyNightActions();
        gs.nightDeaths = [];
        gs.dayEliminated = null;

        // Clear nightly flags
        gs.players.forEach((p) => {
            p.isProtected = false;
        });

        const order = this.getNightPhaseOrder(room);
        const first = order[0] ?? GamePhase.DAY_REVEAL;
        gs.phase = first;
        gs.phaseDeadline = Date.now() + this.getPhaseTime(room.config, 'night_action') * 1000;
        this.log(gs, `🌙 Đêm ${gs.round} — Cả làng nhắm mắt…`);
        return first;
    }

    // ════════════════════════════════════════════
    // NIGHT ACTIONS
    // ════════════════════════════════════════════

    submitNightAction(
        room: MaSoiRoom,
        playerId: string,
        phase: GamePhase,
        payload: {
            targetId?: string;
            targetIds?: string[];
            usePotion?: 'save' | 'kill' | 'none';
            question?: string;
        },
    ): { ok: true } | { error: string } {
        const gs = room.gameState!;
        const player = gs.players.find((p) => p.id === playerId);
        if (!player || player.status !== PlayerStatus.ALIVE) return { error: 'Không hợp lệ.' };

        const na = gs.nightActions;

        switch (phase) {
            case GamePhase.NIGHT_CUPID: {
                if (player.role !== RoleId.CUPID) return { error: 'Bạn không phải Thần Tình Ái.' };
                if (!payload.targetIds || payload.targetIds.length !== 2)
                    return { error: 'Chọn đúng 2 người.' };
                const [a, b] = payload.targetIds;
                if (a === b) return { error: 'Phải chọn 2 người khác nhau.' };
                na.cupidPair = [a, b];
                // Apply lovers link immediately
                const pa = gs.players.find((p) => p.id === a);
                const pb = gs.players.find((p) => p.id === b);
                if (pa && pb) { pa.isLoversLink = b; pb.isLoversLink = a; }
                break;
            }
            case GamePhase.NIGHT_WILD_CHILD: {
                if (player.role !== RoleId.WILD_CHILD) return { error: 'Bạn không phải Đứa Trẻ Hoang Dã.' };
                if (!payload.targetId) return { error: 'Phải chọn idol.' };
                if (payload.targetId === playerId) return { error: 'Không thể chọn bản thân làm idol.' };
                player.idolId = payload.targetId;
                na.wildChildIdol = payload.targetId;
                break;
            }
            case GamePhase.NIGHT_WOLF: {
                if (!this.isWolf(player)) return { error: 'Bạn không phải Ma Sói.' };
                if (!payload.targetId) return { error: 'Phải chọn mục tiêu.' };
                if (payload.targetId === playerId) return { error: 'Không thể tự giết mình.' };
                const target = gs.players.find((p) => p.id === payload.targetId);
                if (!target || target.status !== PlayerStatus.ALIVE) return { error: 'Mục tiêu không hợp lệ.' };

                // Handle cub rage (2nd target slot)
                if (gs.cubRageActive && !na.wolfTarget) {
                    na.wolfTarget = payload.targetId;
                } else if (gs.cubRageActive && na.wolfTarget && !na.wolfSecondTarget) {
                    na.wolfSecondTarget = payload.targetId;
                } else {
                    na.wolfTarget = payload.targetId;
                }
                break;
            }
            case GamePhase.NIGHT_ALPHA: {
                if (player.role !== RoleId.ALPHA_WOLF) return { error: 'Bạn không phải Sói Già.' };
                if (player.alphaWolfUsed) return { error: 'Đã dùng năng lực rồi.' };
                if (payload.targetId) {
                    const target = gs.players.find((p) => p.id === payload.targetId);
                    if (!target || target.status !== PlayerStatus.ALIVE || this.isWolf(target))
                        return { error: 'Mục tiêu không hợp lệ.' };
                    na.alphaTarget = payload.targetId;
                }
                // null targetId = skip using it this round
                break;
            }
            case GamePhase.NIGHT_SEER: {
                if (player.role !== RoleId.SEER && player.role !== RoleId.LITTLE_RED)
                    return { error: 'Bạn không có năng lực này.' };
                if (!payload.targetId) return { error: 'Phải chọn mục tiêu.' };
                if (payload.targetId === playerId) return { error: 'Không thể kiểm tra bản thân.' };
                na.seerTarget = payload.targetId;
                break;
            }
            case GamePhase.NIGHT_DOCTOR: {
                if (player.role !== RoleId.DOCTOR) return { error: 'Bạn không phải Thầy Thuốc.' };
                if (!payload.targetId) return { error: 'Phải chọn mục tiêu.' };
                if (payload.targetId === playerId && !room.config.doctorCanSaveSelf)
                    return { error: 'Không thể tự cứu mình.' };
                if (payload.targetId === player.doctorLastSaved)
                    return { error: 'Không thể cứu cùng 1 người 2 đêm liên tiếp.' };
                na.doctorTarget = payload.targetId;
                break;
            }
            case GamePhase.NIGHT_BODYGUARD: {
                if (player.role !== RoleId.BODYGUARD) return { error: 'Bạn không phải Vệ Sĩ.' };
                if (!payload.targetId) return { error: 'Phải chọn mục tiêu.' };
                if (payload.targetId === player.bodyguardLastProtected)
                    return { error: 'Không thể bảo vệ cùng 1 người 2 đêm liên tiếp.' };
                na.bodyguardTarget = payload.targetId;
                break;
            }
            case GamePhase.NIGHT_WITCH: {
                if (player.role !== RoleId.WITCH) return { error: 'Bạn không phải Phù Thủy.' };
                const use = payload.usePotion;
                if (use === 'save' && !player.witchSaveUsed) {
                    na.witchSaveUsed = true;
                } else if (use === 'kill' && !player.witchKillUsed && payload.targetId) {
                    na.witchKillTarget = payload.targetId;
                }
                // 'none' = skip
                break;
            }
            case GamePhase.NIGHT_FOX: {
                if (player.role !== RoleId.FOX || !player.foxActive) return { error: 'Bạn không có năng lực Cáo.' };
                if (!payload.targetIds || payload.targetIds.length !== 3)
                    return { error: 'Chọn đúng 3 người.' };
                na.foxTargets = payload.targetIds as [string, string, string];
                break;
            }
            case GamePhase.NIGHT_SERIAL_KILLER: {
                if (player.role !== RoleId.SERIAL_KILLER) return { error: 'Bạn không phải Kẻ Giết Người.' };
                if (!payload.targetId) return { error: 'Phải chọn mục tiêu.' };
                if (payload.targetId === playerId) return { error: 'Không thể tự giết mình.' };
                na.serialKillerTarget = payload.targetId;
                break;
            }
            case GamePhase.NIGHT_WHITE_WOLF: {
                if (player.role !== RoleId.WHITE_WOLF) return { error: 'Bạn không phải Sói Trắng.' };
                if (payload.targetId) {
                    const target = gs.players.find((p) => p.id === payload.targetId);
                    if (!target || !this.isWolf(target)) return { error: 'Chỉ có thể giết đồng loại sói.' };
                    na.whiteWolfTarget = payload.targetId;
                }
                break;
            }
            case GamePhase.NIGHT_MEDIUM: {
                if (player.role !== RoleId.MEDIUM) return { error: 'Bạn không phải Đồng Cốt.' };
                if (!payload.targetId || !payload.question) return { error: 'Thiếu thông tin.' };
                na.mediumTarget = payload.targetId;
                na.mediumQuestion = payload.question;
                break;
            }
        }

        na.submittedBy.add(playerId);
        return { ok: true };
    }

    // ════════════════════════════════════════════
    // NIGHT RESOLUTION
    // ════════════════════════════════════════════

    private resolveNightAndStartDay(room: MaSoiRoom): GamePhase {
        const gs = room.gameState!;
        const na = gs.nightActions;
        const deaths: string[] = [];

        // 1. Apply protections
        if (na.doctorTarget) {
            const p = gs.players.find((x) => x.id === na.doctorTarget);
            if (p) {
                p.isProtected = true;
                p.doctorLastSaved = p.id;
                // Update doctor's lastSaved
                const doctor = gs.players.find((x) => x.role === RoleId.DOCTOR);
                if (doctor) doctor.doctorLastSaved = na.doctorTarget;
            }
        }
        if (na.bodyguardTarget) {
            const p = gs.players.find((x) => x.id === na.bodyguardTarget);
            if (p) p.isProtected = true; // bodyguard will die instead
            const bg = gs.players.find((x) => x.role === RoleId.BODYGUARD);
            if (bg) bg.bodyguardLastProtected = na.bodyguardTarget;
        }

        // 2. Resolve wolf kill
        const wolfTargets = [na.wolfTarget, na.wolfSecondTarget].filter(Boolean) as string[];
        gs.cubRageActive = false; // reset cub rage

        for (const targetId of wolfTargets) {
            const target = gs.players.find((p) => p.id === targetId);
            if (!target || target.status !== PlayerStatus.ALIVE) continue;

            // Bodyguard protection: bodyguard dies instead
            const protectedByBodyguard = na.bodyguardTarget === targetId;
            if (protectedByBodyguard) {
                const bodyguard = gs.players.find((p) => p.role === RoleId.BODYGUARD && p.status === PlayerStatus.ALIVE);
                if (bodyguard) {
                    this.killPlayer(gs, bodyguard, deaths);
                    this.log(gs, `🛡️ ${bodyguard.name} hi sinh để bảo vệ ${target.name}!`);
                }
                continue;
            }

            if (target.isProtected) {
                this.log(gs, `💊 Ai đó đã được cứu đêm nay…`);
                continue;
            }

            // Witch save
            if (na.witchSaveUsed && na.doctorTarget === null) {
                const witch = gs.players.find((p) => p.role === RoleId.WITCH);
                if (witch && !witch.witchSaveUsed) {
                    witch.witchSaveUsed = true;
                    this.log(gs, `🧪 Phù Thủy đã dùng thuốc cứu…`);
                    continue;
                }
            }

            // Cursed villager
            if (target.role === RoleId.CURSED_VILLAGER && target.team === Team.VILLAGE) {
                target.role = RoleId.WEREWOLF;
                target.team = Team.WEREWOLF;
                this.log(gs, `😈 Một người đã bị biến thành Ma Sói!`);
                continue;
            }

            // Alpha wolf — convert instead of kill (if alpha chose this target)
            if (na.alphaTarget === targetId) {
                const alpha = gs.players.find((p) => p.role === RoleId.ALPHA_WOLF);
                if (alpha && !alpha.alphaWolfUsed) {
                    alpha.alphaWolfUsed = true;
                    target.team = Team.WEREWOLF;
                    this.log(gs, `🐺 Sói Già đã dùng năng lực chuyển hóa…`);
                    continue;
                }
            }

            // Serial killer is immune to wolf (wolf can't kill SK)
            if (target.role === RoleId.SERIAL_KILLER) continue;

            // Knight: injure the wolf that attacked
            if (target.role === RoleId.KNIGHT) {
                const attackingWolf = gs.players.find(
                    (p) => this.isWolf(p) && p.status === PlayerStatus.ALIVE && !p.isInjured,
                );
                if (attackingWolf) {
                    attackingWolf.isInjured = true;
                    this.log(gs, `⚔️ ${target.name} (Hiệp Sĩ) bị giết nhưng làm ${attackingWolf.name} bị thương!`);
                }
            }

            this.killPlayer(gs, target, deaths);
        }

        // 3. Witch poison
        if (na.witchKillTarget) {
            const target = gs.players.find((p) => p.id === na.witchKillTarget);
            const witch = gs.players.find((p) => p.role === RoleId.WITCH);
            if (target && target.status === PlayerStatus.ALIVE && witch && !witch.witchKillUsed) {
                witch.witchKillUsed = true;
                this.killPlayer(gs, target, deaths);
                this.log(gs, `☠️ Phù Thủy đã dùng thuốc độc…`);
            }
        }

        // 4. Serial killer
        if (na.serialKillerTarget) {
            const target = gs.players.find((p) => p.id === na.serialKillerTarget);
            if (target && target.status === PlayerStatus.ALIVE) {
                this.killPlayer(gs, target, deaths);
            }
        }

        // 5. White wolf
        if (na.whiteWolfTarget) {
            const target = gs.players.find((p) => p.id === na.whiteWolfTarget);
            if (target && target.status === PlayerStatus.ALIVE) {
                this.killPlayer(gs, target, deaths);
            }
        }

        // 6. Fox ability result
        if (na.foxTargets) {
            const fox = gs.players.find((p) => p.role === RoleId.FOX && p.foxActive);
            if (fox) {
                const hasWolf = na.foxTargets.some((id) => {
                    const p = gs.players.find((x) => x.id === id);
                    return p && this.isWolf(p);
                });
                if (!hasWolf) {
                    fox.foxActive = false;
                    this.log(gs, `🦊 Cáo kiểm tra nhóm trong sạch — mất năng lực.`);
                }
            }
        }

        // 7. Reset injured wolves
        gs.players.forEach((p) => {
            if (p.isInjured) p.isInjured = false;
        });

        gs.nightDeaths = deaths;

        // Build log for day reveal
        if (deaths.length === 0) {
            this.log(gs, `☀️ Đêm ${gs.round} bình yên — không ai chết.`);
        } else {
            deaths.forEach((id) => {
                const p = gs.players.find((x) => x.id === id);
                if (p) this.log(gs, `💀 ${p.name} đã chết đêm qua.`);
            });
        }

        gs.phase = GamePhase.DAY_REVEAL;
        gs.phaseDeadline = Date.now() + 6000; // 6s to show reveal
        return GamePhase.DAY_REVEAL;
    }

    startDiscussion(room: MaSoiRoom): void {
        const gs = room.gameState!;
        gs.votes = [];
        gs.phase = GamePhase.DAY_DISCUSSION;
        gs.phaseDeadline = Date.now() + room.config.discussionTime * 1000;
        this.log(gs, `☀️ Ngày ${gs.round} — Hãy tìm ra Ma Sói!`);
    }

    startVoting(room: MaSoiRoom): void {
        const gs = room.gameState!;
        gs.votes = [];
        gs.phase = GamePhase.DAY_VOTE;
        gs.phaseDeadline = Date.now() + room.config.voteTime * 1000;
        this.log(gs, `🗳️ Bỏ phiếu bắt đầu!`);
    }

    // ════════════════════════════════════════════
    // VOTING
    // ════════════════════════════════════════════

    castVote(
        room: MaSoiRoom,
        voterId: string,
        targetId: string | null,
    ): { ok: true } | { error: string } {
        const gs = room.gameState!;
        if (gs.phase !== GamePhase.DAY_VOTE) return { error: 'Chưa đến lúc bỏ phiếu.' };
        const voter = gs.players.find((p) => p.id === voterId);
        if (!voter || voter.status !== PlayerStatus.ALIVE) return { error: 'Bạn không thể bỏ phiếu.' };

        // Remove existing vote
        gs.votes = gs.votes.filter((v) => v.voterId !== voterId);

        if (targetId !== null) {
            const target = gs.players.find((p) => p.id === targetId);
            if (!target || target.status !== PlayerStatus.ALIVE) return { error: 'Mục tiêu không hợp lệ.' };
            gs.votes.push({ voterId, targetId });
        }

        return { ok: true };
    }

    resolveVoting(room: MaSoiRoom): {
        eliminated: MaSoiPlayer | null;
        tie: boolean;
        hunterTriggered: boolean;
    } {
        const gs = room.gameState!;
        const alivePlayers = gs.players.filter((p) => p.status === PlayerStatus.ALIVE);

        // Tally votes (Mayor = 2 votes)
        const tally = new Map<string, number>();
        for (const vote of gs.votes) {
            const voterRole = gs.players.find((p) => p.id === vote.voterId)?.role;
            const weight = voterRole === RoleId.MAYOR ? 2 : 1;
            tally.set(vote.targetId, (tally.get(vote.targetId) ?? 0) + weight);
        }

        // Find max
        let maxVotes = 0;
        for (const v of tally.values()) if (v > maxVotes) maxVotes = v;

        const topCandidates = alivePlayers.filter((p) => (tally.get(p.id) ?? 0) === maxVotes && maxVotes > 0);

        // Tie → no elimination
        if (topCandidates.length !== 1) {
            gs.phase = GamePhase.DAY_VOTE_RESULT;
            gs.phaseDeadline = Date.now() + 5000;
            this.log(gs, `⚖️ Bỏ phiếu hòa — không ai bị loại hôm nay.`);
            return { eliminated: null, tie: true, hunterTriggered: false };
        }

        const target = topCandidates[0];

        // Jester win condition
        if (target.role === RoleId.JESTER) {
            gs.winner = Team.JESTER;
            gs.winnerIds = [target.id];
            this.log(gs, `🃏 ${target.name} (Kẻ Phá Đám) bị treo cổ — Kẻ Phá Đám THẮNG!`);
            gs.phase = GamePhase.GAME_OVER;
            return { eliminated: target, tie: false, hunterTriggered: false };
        }

        // Elder 2-life mechanic
        if (target.role === RoleId.ELDER && target.elderLives === 2) {
            target.elderLives = 1;
            this.log(gs, `👴 ${target.name} (Trưởng Làng) sống sót lần đầu — mất năng lực đặc biệt.`);
            gs.phase = GamePhase.DAY_VOTE_RESULT;
            gs.phaseDeadline = Date.now() + 5000;
            gs.dayEliminated = null;
            return { eliminated: null, tie: false, hunterTriggered: false };
        }

        // Servant — takes mayor/elder role
        if (target.role === RoleId.MAYOR || target.role === RoleId.ELDER) {
            const servant = gs.players.find((p) => p.role === RoleId.SERVANT && p.status === PlayerStatus.ALIVE);
            if (servant) {
                this.log(gs, `🙇 ${servant.name} (Người Hầu) đứng ra thay thế ${target.name}!`);
                servant.role = target.role;
                target.status = PlayerStatus.DEAD;
                this.triggerLoversChain(gs, target, []);
                gs.dayEliminated = target.id;
                gs.phase = GamePhase.DAY_VOTE_RESULT;
                gs.phaseDeadline = Date.now() + 5000;
                return { eliminated: target, tie: false, hunterTriggered: false };
            }
        }

        const deaths: string[] = [];
        this.killPlayer(gs, target, deaths);
        gs.dayEliminated = target.id;
        this.log(gs, `🔨 ${target.name} bị làng bỏ phiếu loại.`);

        // Wolf cub rage
        if (target.role === RoleId.WOLF_CUB) {
            gs.cubRageActive = true;
            this.log(gs, `🐺🍼 Sói Con bị hại — đêm nay đàn sói giết 2 người!`);
        }

        const hunterTriggered =
            target.role === RoleId.HUNTER && !target.hasShot;

        gs.phase = GamePhase.DAY_VOTE_RESULT;
        gs.phaseDeadline = Date.now() + 5000;
        return { eliminated: target, tie: false, hunterTriggered };
    }

    // ════════════════════════════════════════════
    // HUNTER SHOT
    // ════════════════════════════════════════════

    hunterShoot(
        room: MaSoiRoom,
        hunterId: string,
        targetId: string,
    ): { ok: true; target: MaSoiPlayer } | { error: string } {
        const gs = room.gameState!;
        const hunter = gs.players.find((p) => p.id === hunterId);
        if (!hunter || hunter.role !== RoleId.HUNTER || hunter.hasShot)
            return { error: 'Bạn không thể bắn.' };
        const target = gs.players.find((p) => p.id === targetId);
        if (!target || target.status !== PlayerStatus.ALIVE) return { error: 'Mục tiêu không hợp lệ.' };

        hunter.hasShot = true;
        const deaths: string[] = [];
        this.killPlayer(gs, target, deaths);
        this.log(gs, `🏹 ${hunter.name} (Thợ Săn) bắn ${target.name}!`);
        return { ok: true, target };
    }

    // ════════════════════════════════════════════
    // MEDIUM Q&A
    // ════════════════════════════════════════════

    getMediumAnswer(
        room: MaSoiRoom,
        _question: string,
        targetId: string,
    ): boolean | null {
        const gs = room.gameState!;
        const target = gs.players.find((p) => p.id === targetId);
        if (!target || target.status !== PlayerStatus.DEAD) return null;
        // target always answers yes about being their true role
        // For simplicity: ghost always confirms/denies their team
        return target.team === Team.VILLAGE;
    }

    // ════════════════════════════════════════════
    // WIN CHECK
    // ════════════════════════════════════════════

    checkWin(room: MaSoiRoom): { winner: Team | null; winnerIds: string[] } {
        const gs = room.gameState!;
        const result = checkWinCondition(gs.players, gs.cubRageActive);
        if (result.winner !== null) {
            gs.winner = result.winner;
            gs.winnerIds = result.winnerIds;
            gs.phase = GamePhase.GAME_OVER;
        }
        return result;
    }

    // ════════════════════════════════════════════
    // CLIENT VIEW BUILDER
    // ════════════════════════════════════════════

    buildClientState(
        room: MaSoiRoom,
        forPlayerId: string,
    ): ClientMaSoiGameState {
        const gs = room.gameState!;
        const myPlayer = gs.players.find((p) => p.id === forPlayerId);
        const isWolf = myPlayer ? this.isWolf(myPlayer) : false;
        const isDead = myPlayer?.status === PlayerStatus.DEAD;

        const players: ClientMaSoiPlayer[] = gs.players.map((p) => {
            const isSelf = p.id === forPlayerId;
            const revealRole =
                isSelf ||
                (p.status === PlayerStatus.DEAD && room.config.revealRoleOnDeath) ||
                (isDead); // dead players can see all roles
            return {
                id: p.id,
                name: p.name,
                avatar: p.avatar,
                status: p.status,
                isHost: p.isHost,
                isReady: p.isReady,
                role: revealRole ? (p.role ?? undefined) : undefined,
                team: revealRole ? p.team : undefined,
                isDisconnected: p.socketId === '',
                foxActive: isSelf && p.role === RoleId.FOX ? p.foxActive : undefined,
                elderLives: p.role === RoleId.ELDER ? p.elderLives : undefined,
                witchSaveUsed: isSelf && p.role === RoleId.WITCH ? p.witchSaveUsed : undefined,
                witchKillUsed: isSelf && p.role === RoleId.WITCH ? p.witchKillUsed : undefined,
            };
        });

        // Seer/Little Red result this night
        const na = gs.nightActions;
        let seerResult: ClientMaSoiGameState['seerResult'] = undefined;
        if (
            myPlayer &&
            (myPlayer.role === RoleId.SEER || myPlayer.role === RoleId.LITTLE_RED) &&
            na.seerTarget
        ) {
            const target = gs.players.find((p) => p.id === na.seerTarget);
            if (target) {
                seerResult = { targetId: target.id, team: target.team, role: target.role! };
            }
        }

        // Detective result
        let detectiveResult: ClientMaSoiGameState['detectiveResult'] = undefined;
        // Detective result would be stored in a separate field — handled in gateway

        // Fox result
        let foxResult: ClientMaSoiGameState['foxResult'] = undefined;
        if (myPlayer?.role === RoleId.FOX && na.foxTargets) {
            const hasWolf = na.foxTargets.some((id) => {
                const p = gs.players.find((x) => x.id === id);
                return p && this.isWolf(p);
            });
            foxResult = { hasWolf };
        }

        return {
            players,
            phase: gs.phase,
            round: gs.round,
            votes: gs.votes,
            nightDeaths: gs.nightDeaths,
            dayEliminated: gs.dayEliminated,
            log: gs.log.slice(-30),
            winner: gs.winner,
            winnerIds: gs.winnerIds,
            phaseDeadline: gs.phaseDeadline,
            wolfChatEnabled: isWolf,
            myRole: myPlayer?.role ?? undefined,
            myTeam: myPlayer?.team,
            myWolfMates: isWolf
                ? gs.players
                    .filter((p) => this.isWolf(p) && p.id !== forPlayerId && p.status === PlayerStatus.ALIVE)
                    .map((p) => p.id)
                : undefined,
            myLoversPartner: myPlayer?.isLoversLink ?? undefined,
            myIdol: myPlayer?.idolId ?? undefined,
            seerResult,
            detectiveResult,
            foxResult,
        };
    }

    /** State for lobby (no game) */
    buildClientRoom(room: MaSoiRoom): import('./types.js').ClientMaSoiRoom {
        return {
            id: room.id,
            name: room.name,
            hasPassword: !!room.password,
            hostId: room.hostId,
            maxPlayers: room.maxPlayers,
            players: room.players.map((p) => ({
                id: p.id,
                name: p.name,
                avatar: p.avatar,
                status: p.status,
                isHost: p.isHost,
                isReady: p.isReady,
                isDisconnected: false,
            })),
            status: room.status,
            config: room.config,
        };
    }

    // ════════════════════════════════════════════
    // HELPERS
    // ════════════════════════════════════════════

    private killPlayer(gs: MaSoiGameState, player: MaSoiPlayer, deathList: string[]): void {
        player.status = PlayerStatus.DEAD;
        deathList.push(player.id);
        this.triggerLoversChain(gs, player, deathList);
        // Wild child check
        gs.players.forEach((p) => {
            if (p.role === RoleId.WILD_CHILD && p.idolId === player.id && p.team === Team.VILLAGE) {
                p.team = Team.WEREWOLF;
                this.log(gs, `🐾 ${p.name} (Đứa Trẻ Hoang Dã) mất idol — đã trở thành Ma Sói!`);
            }
        });
    }

    private triggerLoversChain(gs: MaSoiGameState, dead: MaSoiPlayer, deathList: string[]): void {
        if (!dead.isLoversLink) return;
        const partner = gs.players.find((p) => p.id === dead.isLoversLink);
        if (partner && partner.status === PlayerStatus.ALIVE) {
            partner.status = PlayerStatus.DEAD;
            deathList.push(partner.id);
            this.log(gs, `💔 ${partner.name} chết theo người yêu ${dead.name}.`);
        }
    }

    isWolf(player: MaSoiPlayer): boolean {
        return (
            player.team === Team.WEREWOLF ||
            player.role === RoleId.WEREWOLF ||
            player.role === RoleId.ALPHA_WOLF ||
            player.role === RoleId.WOLF_CUB ||
            player.role === RoleId.WHITE_WOLF
        );
    }

    private hasAliveRole(players: MaSoiPlayer[], role: RoleId): boolean {
        return players.some((p) => p.role === role && p.status === PlayerStatus.ALIVE);
    }

    private getDefaultTeam(role: RoleId): Team {
        const wolfRoles = [RoleId.WEREWOLF, RoleId.ALPHA_WOLF, RoleId.WOLF_CUB, RoleId.WHITE_WOLF];
        if (wolfRoles.includes(role)) return Team.WEREWOLF;
        if (role === RoleId.JESTER) return Team.JESTER;
        if (role === RoleId.SERIAL_KILLER) return Team.SERIAL_KILLER;
        return Team.VILLAGE;
    }

    private getPhaseTime(config: GameConfig, type: 'night_action' | 'discussion' | 'vote'): number {
        const speedMult = config.speed === 'fast' ? 0.6 : config.speed === 'slow' ? 1.5 : 1;
        switch (type) {
            case 'night_action': return Math.round(config.nightActionTime * speedMult);
            case 'discussion': return Math.round(config.discussionTime * speedMult);
            case 'vote': return Math.round(config.voteTime * speedMult);
        }
    }

    private emptyNightActions(): NightActions {
        return {
            wolfTarget: null,
            wolfSecondTarget: null,
            alphaTarget: null,
            seerTarget: null,
            doctorTarget: null,
            bodyguardTarget: null,
            witchSaveUsed: false,
            witchKillTarget: null,
            foxTargets: null,
            serialKillerTarget: null,
            whiteWolfTarget: null,
            mediumTarget: null,
            mediumQuestion: null,
            cupidPair: null,
            wildChildIdol: null,
            submittedBy: new Set(),
        };
    }

    private log(gs: MaSoiGameState, msg: string): void {
        gs.log.push(msg);
        if (gs.log.length > MAX_LOG) gs.log.shift();
    }

    private shuffle<T>(arr: T[]): T[] {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
}
