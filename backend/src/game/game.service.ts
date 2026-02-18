import { Injectable } from '@nestjs/common';
import {
    Room,
    RoomStatus,
    GameState,
    CardType,
    Card,
    Player,
    PendingAction,
    ClientGameState,
    CARD_INFO,
} from './types.js';
import {
    createDeck,
    dealCards,
    insertExplodingKittens,
    shuffleDeck,
    isCatCard,
    areSameType,
    areFiveDifferentCats,
} from './card-engine.js';
import { RoomService } from './room.service.js';

@Injectable()
export class GameService {
    constructor(private readonly roomService: RoomService) { }

    startGame(room: Room): { success: boolean; error?: string } {
        if (room.players.length < 2) {
            return { success: false, error: 'Cần ít nhất 2 người chơi!' };
        }

        // Create deck without Exploding Kittens
        const deck = createDeck(room.players.length);

        // Deal cards to players
        const { hands, remainingDeck } = dealCards(deck, room.players.length);

        // Assign hands to players
        room.players.forEach((player, index) => {
            player.hand = hands[index];
            player.isAlive = true;
        });

        // Insert Exploding Kittens into remaining deck
        const finalDeck = insertExplodingKittens(
            remainingDeck,
            room.players.length,
        );

        // Create turn order (shuffle player order)
        const turnOrder = room.players.map((p) => p.id);
        // Shuffle turn order for fairness
        for (let i = turnOrder.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [turnOrder[i], turnOrder[j]] = [turnOrder[j], turnOrder[i]];
        }

        room.gameState = {
            deck: finalDeck,
            discardPile: [],
            currentPlayerIndex: 0,
            turnOrder,
            drawsRemaining: 1,
            pendingAction: null,
            nopeTimer: null,
            lastPlayedAction: null,
            winner: null,
            turnStartTime: Date.now(),
            turnTimeLimit: 30,
            turnTimer: null,
        };

        room.status = RoomStatus.PLAYING;
        return { success: true };
    }

    playCard(
        room: Room,
        playerId: string,
        cardIds: string[],
        targetId?: string,
    ): {
        success: boolean;
        error?: string;
        action?: string;
        needsTarget?: boolean;
        futureCards?: Card[];
        targetHand?: Card[];
    } {
        const gs = room.gameState!;
        const player = room.players.find((p) => p.id === playerId);
        if (!player) return { success: false, error: 'Người chơi không tồn tại!' };
        if (!player.isAlive)
            return { success: false, error: 'Bạn đã bị loại!' };

        // Find cards in hand
        const cards: Card[] = [];
        for (const cardId of cardIds) {
            const card = player.hand.find((c) => c.id === cardId);
            if (!card)
                return { success: false, error: 'Không tìm thấy lá bài!' };
            cards.push(card);
        }

        const cardType = cards[0].type;

        // NOPE can be played anytime (even out of turn)
        if (cardType === CardType.NOPE) {
            return this.handleNope(room, player, cards[0]);
        }

        // Check if it's this player's turn (for non-Nope cards)
        const currentPlayerId = gs.turnOrder[gs.currentPlayerIndex];
        if (playerId !== currentPlayerId) {
            return {
                success: false,
                error: 'Chưa đến lượt bạn!',
            };
        }

        // Check for pending action
        if (gs.pendingAction) {
            return { success: false, error: 'Đang có hành động cần xử lý!' };
        }



        const card = cards[0];

        // 1. Check for Cat Combos (2, 3, 5 cards) -> Delay 5s
        if (cards.length >= 2 && cards.every((c) => isCatCard(c.type))) {
            // Validate Combo requirements BEFORE delay
            // 2 same cats -> need target
            if (cards.length === 2 && areSameType(cards)) {
                if (!targetId) return { success: false, needsTarget: true, error: 'Chọn người để lấy bài!' };
                const target = room.players.find(p => p.id === targetId);
                if (!target || !target.isAlive || target.hand.length === 0) return { success: false, error: 'Mục tiêu không hợp lệ!' };
            }
            // 3 same cats -> need target
            if (cards.length === 3 && areSameType(cards)) {
                if (!targetId) return { success: false, needsTarget: true, error: 'Chọn người để xem bài!' };
                const target = room.players.find(p => p.id === targetId);
                if (!target || !target.isAlive || target.hand.length === 0) return { success: false, error: 'Mục tiêu không hợp lệ!' };
            }
            // 5 diff cats -> pick from discard (no target needed initially, or targetId is cardId from discard?)
            // targetId in handleCatCombo for 5 cats is actually cardId. 
            // Logic in handleCatCombo checks if 5 diff cats.
            if (areFiveDifferentCats(cards)) {
                if (gs.discardPile.length === 0) return { success: false, error: 'Đống bài đã đánh đang trống!' };
            }

            // Queue Delay
            this.removeCardsFromHand(player, cards);
            this.discardCards(gs, cards);

            gs.pendingAction = {
                type: 'delayed_effect',
                playerId: player.id,
                targetId,
                data: {
                    cards, // Store all cards
                    actionType: 'combo',
                },
            };

            gs.lastPlayedAction = {
                playerId: player.id,
                cardType: cards[0].type, // Approximate
                targetId,
                timestamp: Date.now(),
            };

            return {
                success: true,
                action: `${player.name} dùng Combo Mèo... ⏳ Đang chờ (5s)`,
            };
        }

        // Single card valid check
        if (cards.length !== 1) {
            return { success: false, error: 'Chỉ được chơi 1 lá hoặc combo mèo!' };
        }

        // 2. Action cards that can be Noped -> Delay 5s
        if (
            [
                CardType.SKIP,
                CardType.ATTACK,
                CardType.SHUFFLE,
                CardType.SEE_THE_FUTURE,
                CardType.FAVOR,
            ].includes(card.type)
        ) {
            // Validate Favor Target
            if (card.type === CardType.FAVOR) {
                if (!targetId) return { success: false, needsTarget: true, error: 'Chọn người để xin lì xì!' };
                const target = room.players.find(p => p.id === targetId);
                if (!target || !target.isAlive || target.hand.length === 0) return { success: false, error: 'Mục tiêu không hợp lệ!' };
            }

            this.removeCardsFromHand(player, [card]);
            this.discardCards(gs, [card]);

            gs.pendingAction = {
                type: 'delayed_effect',
                playerId: player.id,
                targetId,
                data: {
                    card, // Single card
                    actionType: card.type,
                },
            };

            gs.lastPlayedAction = {
                playerId: player.id,
                cardType: card.type,
                targetId,
                timestamp: Date.now(),
            };

            return {
                success: true,
                action: `${player.name} sử dụng ${CARD_INFO[card.type].name}... ⏳ Đang chờ (5s)`,
            };
        }

        switch (card.type) {
            case CardType.DEFUSE:
                return {
                    success: false,
                    error: 'Tháo Ngòi chỉ dùng khi bốc phải Pháo Mèo!',
                };
            case CardType.EXPLODING_KITTEN:
                return { success: false, error: 'Không thể chơi lá Pháo Mèo!' };
            default:
                // Should be cat cards played singly/improperly
                if (isCatCard(card.type)) {
                    return {
                        success: false,
                        error: 'Cần chơi 2 hoặc 3 lá mèo giống nhau, hoặc 5 lá mèo khác loại!',
                    };
                }
                return { success: false, error: 'Lá bài không hợp lệ!' };
        }
    }

    resolvePendingAction(room: Room): { success: boolean; action?: string; futureCards?: Card[] } {
        const gs = room.gameState!;
        if (!gs.pendingAction || gs.pendingAction.type !== 'delayed_effect') {
            return { success: false };
        }

        const { playerId, targetId, data } = gs.pendingAction;
        const player = room.players.find((p) => p.id === playerId);

        // Clear pending action before executing
        gs.pendingAction = null;

        if (!player) return { success: false };

        // Handle Combos
        if (data.actionType === 'combo') {
            return this.handleCatCombo(room, player, data.cards, targetId, true);
        }

        const card = data.card as Card;

        switch (card.type) {
            case CardType.SKIP:
                return this.handleSkip(room, player, card, true);
            case CardType.ATTACK:
                return this.handleAttack(room, player, card, true);
            case CardType.SHUFFLE:
                return this.handleShuffle(room, player, card, true);
            case CardType.SEE_THE_FUTURE:
                return this.handleSeeTheFuture(room, player, card, true);
            case CardType.FAVOR:
                return this.handleFavor(room, player, card, targetId, true);
            default:
                return { success: false };
        }
    }

    private removeCardsFromHand(player: Player, cards: Card[]): void {
        for (const card of cards) {
            const index = player.hand.findIndex((c) => c.id === card.id);
            if (index !== -1) {
                player.hand.splice(index, 1);
            }
        }
    }

    private discardCards(gs: GameState, cards: Card[]): void {
        gs.discardPile.push(...cards);
    }

    private handleSkip(
        room: Room,
        player: Player,
        card: Card,
        fromDelay = false
    ): { success: boolean; action: string } {
        const gs = room.gameState!;

        if (!fromDelay) {
            this.removeCardsFromHand(player, [card]);
            this.discardCards(gs, [card]);
        }

        gs.drawsRemaining--;
        if (gs.drawsRemaining <= 0) {
            this.advanceTurn(room);
        } else {
            return { success: true, action: `${player.name} bỏ lượt! 🏃 (Còn phải bốc ${gs.drawsRemaining} lần)` };
        }

        return { success: true, action: `${player.name} bỏ lượt! 🏃` };
    }

    private handleAttack(
        room: Room,
        player: Player,
        card: Card,
        fromDelay = false
    ): { success: boolean; action: string } {
        const gs = room.gameState!;

        if (!fromDelay) {
            this.removeCardsFromHand(player, [card]);
            this.discardCards(gs, [card]);
        }
        const nextPlayerIndex = this.getNextAlivePlayerIndex(room, gs.currentPlayerIndex);
        gs.currentPlayerIndex = nextPlayerIndex;
        gs.drawsRemaining = gs.drawsRemaining + 1; // stack with existing draws

        gs.lastPlayedAction = {
            playerId: player.id,
            cardType: CardType.ATTACK,
            timestamp: Date.now(),
        };

        const nextPlayer = room.players.find(
            (p) => p.id === gs.turnOrder[gs.currentPlayerIndex],
        );
        return {
            success: true,
            action: `${player.name} tấn công ${nextPlayer?.name}! ⚔️ Phải bốc ${gs.drawsRemaining} lần!`,
        };
    }

    private handleShuffle(
        room: Room,
        player: Player,
        card: Card,
        fromDelay = false
    ): { success: boolean; action: string } {
        const gs = room.gameState!;

        if (!fromDelay) {
            this.removeCardsFromHand(player, [card]);
            this.discardCards(gs, [card]);
        }

        shuffleDeck(gs.deck);

        return { success: true, action: `${player.name} xáo bài! 🔀` };
    }

    private handleSeeTheFuture(
        room: Room,
        player: Player,
        card: Card,
        fromDelay = false
    ): { success: boolean; action: string; futureCards: Card[] } {
        const gs = room.gameState!;

        if (!fromDelay) {
            this.removeCardsFromHand(player, [card]);
            this.discardCards(gs, [card]);
        }
        // Show top 3 cards (last 3 in array since we pop from end)
        const top3 = gs.deck.slice(-3).reverse();

        gs.lastPlayedAction = {
            playerId: player.id,
            cardType: CardType.SEE_THE_FUTURE,
            timestamp: Date.now(),
        };

        return {
            success: true,
            action: `${player.name} bói Tết! 🔮`,
            futureCards: top3,
        };
    }

    private handleFavor(
        room: Room,
        player: Player,
        card: Card,
        targetId?: string,
        fromDelay = false
    ): { success: boolean; error?: string; action?: string } {
        const gs = room.gameState!;

        if (!targetId) {
            return {
                success: false,
                error: 'Cần chọn người để xin lì xì!',
                action: undefined,
            };
        }

        const target = room.players.find((p) => p.id === targetId);
        if (!target || !target.isAlive) {
            return { success: false, error: 'Người chơi không hợp lệ!' };
        }

        if (target.hand.length === 0) {
            return { success: false, error: 'Người này không có bài!' };
        }

        if (!fromDelay) {
            this.removeCardsFromHand(player, [card]);
            this.discardCards(gs, [card]);
        }
        // Set pending action for the target to choose a card to give
        gs.pendingAction = {
            type: 'favor_give',
            playerId: targetId, // The target is now the one who needs to act
            targetId: player.id, // The original player is the recipient
            data: {
                cardType: CardType.FAVOR,
            },
        };

        gs.lastPlayedAction = {
            playerId: player.id,
            cardType: CardType.FAVOR,
            targetId,
            timestamp: Date.now(),
        };

        return {
            success: true,
            action: `${player.name} xin lì xì từ ${target.name}! 🧧`,
        };
    }

    private handleNope(
        room: Room,
        player: Player,
        card: Card,
    ): { success: boolean; error?: string; action?: string } {
        const gs = room.gameState!;

        // 1. Cancel pending delayed action
        if (gs.pendingAction?.type === 'delayed_effect') {
            const blockedPlayer = room.players.find(p => p.id === gs.pendingAction!.playerId);
            const blockedCardType = gs.pendingAction.data.actionType as CardType;

            // Remove Nope card
            this.removeCardsFromHand(player, [card]);
            this.discardCards(gs, [card]);

            // Clear pending action
            gs.pendingAction = null;

            gs.lastPlayedAction = {
                playerId: player.id,
                cardType: CardType.NOPE,
                timestamp: Date.now(),
            };

            return {
                success: true,
                action: `${player.name} dùng NOPE! 🚫 Chặn đứng ${CARD_INFO[blockedCardType]?.name || 'hành động'} của ${blockedPlayer?.name}!`,
            };
        }

        // 2. Or cancel last played action if it barely happened (race condition or visual effect?)
        // In this delayed design, Nope is effective strictly during the delay. 
        // If delay is over, the action has happened (e.g., cards shuffled, attack turn passed).
        // So standard Nope logic usually only applies to pending actions.
        // But for completeness, strict rules say Nope can Nope a Nope.

        // TODO: Implement Nope a Nope (too complex for now, focus on blocking actions)

        this.removeCardsFromHand(player, [card]);
        this.discardCards(gs, [card]);

        return {
            success: true,
            action: `${player.name} dùng NOPE! 🚫 Nhưng không có gì để chặn (hoặc đã quá muộn)!`,
        };
    }

    private handleCatCombo(
        room: Room,
        player: Player,
        cards: Card[],
        targetId?: string,
        fromDelay = false
    ): {
        success: boolean;
        error?: string;
        action?: string;
        needsTarget?: boolean;
        targetHand?: Card[];
    } {
        const gs = room.gameState!;

        // 5 different cats
        if (areFiveDifferentCats(cards)) {
            if (!fromDelay) {
                this.removeCardsFromHand(player, cards);
                this.discardCards(gs, cards);
            }

            // If targetId was passed (from pendingAction data or playCard), it might be cardId
            // But actually for 5 cats, the player picks from discard pile AFTER playing.
            // So we enter pending state 'pick_card_from_player' with source 'discard'

            // Wait, if it was delayed, we already removed cards.

            gs.pendingAction = {
                type: 'pick_card_from_player',
                playerId: player.id,
                data: { source: 'discard' },
            };

            gs.lastPlayedAction = {
                playerId: player.id,
                cardType: cards[0].type,
                timestamp: Date.now(),
            };

            return {
                success: true,
                action: `${player.name} chơi 5 mèo khác loại! 🎉 Chọn 1 lá từ đống bài đã đánh!`,
            };
        }

        // 2 same cats
        if (cards.length === 2 && areSameType(cards)) {
            if (!targetId) return { success: false, needsTarget: true, error: 'Chọn người để lấy bài!' };

            const target = room.players.find((p) => p.id === targetId);
            if (!target || !target.isAlive || target.hand.length === 0) {
                return { success: false, error: 'Người chơi không hợp lệ hoặc hết bài!' };
            }

            if (!fromDelay) {
                this.removeCardsFromHand(player, cards);
                this.discardCards(gs, cards);
            }

            // Take random card from target
            const randomIndex = Math.floor(Math.random() * target.hand.length);
            const stolenCard = target.hand.splice(randomIndex, 1)[0];
            player.hand.push(stolenCard);

            gs.lastPlayedAction = {
                playerId: player.id,
                cardType: cards[0].type,
                targetId,
                timestamp: Date.now(),
            };

            const cardName = CARD_INFO[stolenCard.type]?.name || stolenCard.type;
            return {
                success: true,
                action: `${player.name} chơi 2 ${CARD_INFO[cards[0].type]?.name} và lấy 1 lá ngẫu nhiên từ ${target.name}!`,
            };
        }

        // 3 same cats
        if (cards.length === 3 && areSameType(cards)) {
            if (!targetId) return { success: false, needsTarget: true, error: 'Chọn người để xem bài!' };

            const target = room.players.find((p) => p.id === targetId);
            if (!target || !target.isAlive || target.hand.length === 0) {
                return { success: false, error: 'Người chơi không hợp lệ hoặc hết bài!' };
            }

            if (!fromDelay) {
                this.removeCardsFromHand(player, cards);
                this.discardCards(gs, cards);
            }

            // Set pending action
            gs.pendingAction = {
                type: 'pick_card_from_player',
                playerId: player.id,
                targetId,
                data: { source: 'hand' },
            };

            gs.lastPlayedAction = {
                playerId: player.id,
                cardType: cards[0].type,
                targetId,
                timestamp: Date.now(),
            };

            return {
                success: true,
                action: `${player.name} chơi 3 ${CARD_INFO[cards[0].type]?.name}! Đang chọn lá bài từ ${target.name}... 👀`,
                targetHand: target.hand,
            };
        }

        return { success: false, error: 'Combo không hợp lệ!' };
    }

    drawCard(
        room: Room,
        playerId: string,
    ): {
        success: boolean;
        error?: string;
        card?: Card;
        exploded?: boolean;
        action?: string;
    } {
        const gs = room.gameState!;
        const player = room.players.find((p) => p.id === playerId);
        if (!player) return { success: false, error: 'Người chơi không tồn tại!' };

        const currentPlayerId = gs.turnOrder[gs.currentPlayerIndex];
        if (playerId !== currentPlayerId) {
            return { success: false, error: 'Chưa đến lượt bạn!' };
        }

        if (gs.pendingAction) {
            return { success: false, error: 'Đang có hành động cần xử lý!' };
        }

        if (gs.deck.length === 0) {
            return { success: false, error: 'Hết bài!' };
        }

        const card = gs.deck.pop()!;

        if (card.type === CardType.EXPLODING_KITTEN) {
            // Check if player has Defuse
            const defuseCard = player.hand.find((c) => c.type === CardType.DEFUSE);

            if (defuseCard) {
                // Set pending action: player must choose where to insert the Exploding Kitten
                gs.pendingAction = {
                    type: 'defuse_insert',
                    playerId,
                    data: { explodingKittenCard: card },
                };

                return {
                    success: true,
                    card,
                    exploded: false,
                    action: `${player.name} bốc phải Pháo Mèo! 🧨 Nhưng có Tháo Ngòi! 🧯`,
                };
            } else {
                // Player is eliminated
                player.isAlive = false;
                gs.discardPile.push(card);
                // Discard all their cards
                gs.discardPile.push(...player.hand);
                player.hand = [];

                // Check if game is over
                const alivePlayers = room.players.filter((p) => p.isAlive);
                if (alivePlayers.length === 1) {
                    gs.winner = alivePlayers[0].id;
                    room.status = RoomStatus.FINISHED;

                    // Auto-delete room after 60 seconds
                    setTimeout(() => {
                        this.roomService.deleteRoom(room.id);
                    }, 60000);

                    return {
                        success: true,
                        card,
                        exploded: true,
                        action: `${player.name} bốc phải Pháo Mèo và KHÔNG có Tháo Ngòi! 💥 ${player.name} bị loại! 🏆 ${alivePlayers[0].name} THẮNG!`,
                    };
                }

                // Remove from turn order and advance
                this.advanceTurnAfterElimination(room, playerId);

                return {
                    success: true,
                    card,
                    exploded: true,
                    action: `${player.name} bốc phải Pháo Mèo và KHÔNG có Tháo Ngòi! 💥 ${player.name} bị loại!`,
                };
            }
        }

        // Normal card
        player.hand.push(card);

        gs.drawsRemaining--;
        if (gs.drawsRemaining <= 0) {
            this.advanceTurn(room);
        }

        gs.lastPlayedAction = null;

        return {
            success: true,
            card,
            exploded: false,
            action: `${player.name} bốc 1 lá bài.`,
        };
    }

    handleDefuse(
        room: Room,
        playerId: string,
        insertPosition: number,
    ): { success: boolean; error?: string; action?: string } {
        const gs = room.gameState!;
        const player = room.players.find((p) => p.id === playerId);

        if (!player) return { success: false, error: 'Người chơi không tồn tại!' };

        if (
            !gs.pendingAction ||
            gs.pendingAction.type !== 'defuse_insert' ||
            gs.pendingAction.playerId !== playerId
        ) {
            return { success: false, error: 'Không có Pháo Mèo cần tháo ngòi!' };
        }

        // Remove Defuse from hand
        const defuseIndex = player.hand.findIndex(
            (c) => c.type === CardType.DEFUSE,
        );
        if (defuseIndex === -1) {
            return { success: false, error: 'Bạn không có Tháo Ngòi!' };
        }

        const defuseCard = player.hand.splice(defuseIndex, 1)[0];
        gs.discardPile.push(defuseCard);

        // Insert Exploding Kitten back into deck at chosen position
        const ekCard = gs.pendingAction.data.explodingKittenCard;
        const clampedPos = Math.max(
            0,
            Math.min(insertPosition, gs.deck.length),
        );
        gs.deck.splice(clampedPos, 0, ekCard);

        gs.pendingAction = null;

        // Continue with draws
        gs.drawsRemaining--;
        if (gs.drawsRemaining <= 0) {
            this.advanceTurn(room);
        }

        gs.lastPlayedAction = {
            playerId,
            cardType: CardType.DEFUSE,
            timestamp: Date.now(),
        };

        return {
            success: true,
            action: `${player.name} tháo ngòi thành công! 🧯 Pháo Mèo đã được giấu lại trong bộ bài...`,
        };
    }

    handleGiveCard(
        room: Room,
        playerId: string,
        cardId: string,
    ): { success: boolean; error?: string; action?: string } {
        const gs = room.gameState!;
        const player = room.players.find((p) => p.id === playerId);

        if (!player) return { success: false, error: 'Người chơi không tồn tại!' };

        if (
            !gs.pendingAction ||
            gs.pendingAction.type !== 'favor_give' ||
            gs.pendingAction.playerId !== playerId
        ) {
            return { success: false, error: 'Không cần cho bài!' };
        }

        const cardIndex = player.hand.findIndex((c) => c.id === cardId);
        if (cardIndex === -1) {
            return { success: false, error: 'Không tìm thấy lá bài!' };
        }

        const card = player.hand.splice(cardIndex, 1)[0];
        const receiver = room.players.find(
            (p) => p.id === gs.pendingAction!.targetId,
        );
        if (receiver) {
            receiver.hand.push(card);
        }

        const cardName = CARD_INFO[card.type]?.name || card.type;
        gs.pendingAction = null;

        return {
            success: true,
            action: `${player.name} cho ${receiver?.name} 1 lá ${cardName}! 🧧`,
        };
    }

    handlePickCard(
        room: Room,
        playerId: string,
        cardId: string,
    ): { success: boolean; error?: string; action?: string } {
        const gs = room.gameState!;
        const player = room.players.find((p) => p.id === playerId);

        if (!player) return { success: false, error: 'Người chơi không tồn tại!' };

        if (
            !gs.pendingAction ||
            gs.pendingAction.type !== 'pick_card_from_player' ||
            gs.pendingAction.playerId !== playerId
        ) {
            return { success: false, error: 'Không cần chọn bài!' };
        }

        if (gs.pendingAction.data?.source === 'discard') {
            // Pick from discard pile
            const cardIndex = gs.discardPile.findIndex((c) => c.id === cardId);
            if (cardIndex === -1) {
                return { success: false, error: 'Lá bài không có trong đống bỏ!' };
            }
            const card = gs.discardPile.splice(cardIndex, 1)[0];
            player.hand.push(card);
            gs.pendingAction = null;
            const cardName = CARD_INFO[card.type]?.name || card.type;
            return {
                success: true,
                action: `${player.name} lấy lá ${cardName} từ đống bài đã đánh! 🎉`,
            };
        } else {
            // Pick from target's hand
            const target = room.players.find(
                (p) => p.id === gs.pendingAction!.targetId,
            );
            if (!target) return { success: false, error: 'Đối thủ không tồn tại!' };

            const cardIndex = target.hand.findIndex((c) => c.id === cardId);
            if (cardIndex === -1) {
                return {
                    success: false,
                    error: 'Lá bài không có trong tay đối thủ!',
                };
            }
            const card = target.hand.splice(cardIndex, 1)[0];
            player.hand.push(card);
            gs.pendingAction = null;
            const cardName = CARD_INFO[card.type]?.name || card.type;
            return {
                success: true,
                action: `${player.name} lấy lá ${cardName} từ ${target.name}! 👀`,
            };
        }
    }

    getClientGameState(room: Room, playerId: string): ClientGameState {
        const gs = room.gameState!;
        const player = room.players.find((p) => p.id === playerId);

        const elapsed = (Date.now() - gs.turnStartTime) / 1000;
        const remaining = Math.max(0, gs.turnTimeLimit - elapsed);

        return {
            myHand: player?.hand || [],
            players: room.players.map((p) =>
                this.roomService.toClientPlayer(p),
            ),
            deckCount: gs.deck.length,
            discardPile: gs.discardPile,
            currentPlayerId: gs.turnOrder[gs.currentPlayerIndex],
            drawsRemaining: gs.drawsRemaining,
            pendingAction: gs.pendingAction,
            lastPlayedAction: gs.lastPlayedAction,
            winner: gs.winner,
            turnTimeRemaining: Math.round(remaining),
        };
    }

    private advanceTurn(room: Room): void {
        const gs = room.gameState!;
        gs.currentPlayerIndex = this.getNextAlivePlayerIndex(
            room,
            gs.currentPlayerIndex,
        );
        gs.drawsRemaining = 1;
        gs.lastPlayedAction = null;
        gs.turnStartTime = Date.now();
    }

    advanceTurnAfterElimination(
        room: Room,
        eliminatedPlayerId: string,
    ): void {
        const gs = room.gameState!;

        // Remove eliminated player from turn order
        const elimIndex = gs.turnOrder.indexOf(eliminatedPlayerId);
        if (elimIndex !== -1) {
            gs.turnOrder.splice(elimIndex, 1);
            // Adjust current index
            if (gs.currentPlayerIndex >= gs.turnOrder.length) {
                gs.currentPlayerIndex = 0;
            }
            if (elimIndex < gs.currentPlayerIndex) {
                gs.currentPlayerIndex--;
            }
        }

        gs.drawsRemaining = 1;
        gs.lastPlayedAction = null;
    }

    private getNextAlivePlayerIndex(
        room: Room,
        currentIndex: number,
    ): number {
        const gs = room.gameState!;
        let nextIndex = (currentIndex + 1) % gs.turnOrder.length;
        let attempts = 0;

        while (attempts < gs.turnOrder.length) {
            const nextPlayerId = gs.turnOrder[nextIndex];
            const nextPlayer = room.players.find((p) => p.id === nextPlayerId);
            if (nextPlayer?.isAlive) {
                return nextIndex;
            }
            nextIndex = (nextIndex + 1) % gs.turnOrder.length;
            attempts++;
        }

        return currentIndex; // fallback
    }
}
