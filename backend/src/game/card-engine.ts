import { v4 as uuidv4 } from 'uuid';
import { Card, CardType, CAT_CARDS } from './types.js';

// Card counts per player bracket
interface DeckConfig {
    [CardType.DEFUSE]: number;
    [CardType.SKIP]: number;
    [CardType.ATTACK]: number;
    [CardType.SHUFFLE]: number;
    [CardType.SEE_THE_FUTURE]: number;
    [CardType.NOPE]: number;
    [CardType.FAVOR]: number;
    cats: number; // per cat type
}

function getDeckConfig(playerCount: number): DeckConfig {
    // Scale cards based on player count
    const scale = playerCount <= 5 ? 1 : playerCount <= 8 ? 1.5 : 2;

    return {
        [CardType.DEFUSE]: Math.ceil(playerCount + 1), // N+1 Defuses total (1 each + extras in deck)
        [CardType.SKIP]: Math.ceil(4 * scale),
        [CardType.ATTACK]: Math.ceil(4 * scale),
        [CardType.SHUFFLE]: Math.ceil(4 * scale),
        [CardType.SEE_THE_FUTURE]: Math.ceil(3 * scale),
        [CardType.NOPE]: Math.ceil(5 * scale),
        [CardType.FAVOR]: Math.ceil(4 * scale),
        cats: Math.ceil(4 * scale),
    };
}

function createCards(type: CardType, count: number): Card[] {
    return Array.from({ length: count }, () => ({
        id: uuidv4(),
        type,
    }));
}

/**
 * Fisher-Yates shuffle algorithm
 */
export function shuffleDeck(deck: Card[]): Card[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Create a full deck for the given number of players (WITHOUT Exploding Kittens)
 * Each player starts with 1 Defuse, so we put remaining Defuses in the deck
 */
export function createDeck(playerCount: number): Card[] {
    const config = getDeckConfig(playerCount);
    const deck: Card[] = [];

    // Defuses: total - playerCount go into deck (each player gets 1)
    const defusesInDeck = Math.max(config[CardType.DEFUSE] - playerCount, 1);
    deck.push(...createCards(CardType.DEFUSE, defusesInDeck));

    // Action cards
    deck.push(...createCards(CardType.SKIP, config[CardType.SKIP]));
    deck.push(...createCards(CardType.ATTACK, config[CardType.ATTACK]));
    deck.push(...createCards(CardType.SHUFFLE, config[CardType.SHUFFLE]));
    deck.push(
        ...createCards(
            CardType.SEE_THE_FUTURE,
            config[CardType.SEE_THE_FUTURE],
        ),
    );
    deck.push(...createCards(CardType.NOPE, config[CardType.NOPE]));
    deck.push(...createCards(CardType.FAVOR, config[CardType.FAVOR]));

    // Cat cards (5 types)
    for (const catType of CAT_CARDS) {
        deck.push(...createCards(catType, config.cats));
    }

    return shuffleDeck(deck);
}

/**
 * Deal initial hands: 1 Defuse + 7 random cards from deck
 */
export function dealCards(
    deck: Card[],
    playerCount: number,
): { hands: Card[][]; remainingDeck: Card[] } {
    const hands: Card[][] = [];
    let remaining = [...deck];

    for (let i = 0; i < playerCount; i++) {
        const hand: Card[] = [];

        // 1 Defuse card
        hand.push({ id: uuidv4(), type: CardType.DEFUSE });

        // 7 random cards from deck
        for (let j = 0; j < 7; j++) {
            if (remaining.length > 0) {
                hand.push(remaining.pop()!);
            }
        }

        hands.push(hand);
    }

    return { hands, remainingDeck: remaining };
}

/**
 * Insert Exploding Kittens into the deck after dealing
 * N-1 Exploding Kittens for N players
 */
export function insertExplodingKittens(
    deck: Card[],
    playerCount: number,
): Card[] {
    const explodingKittens = createCards(
        CardType.EXPLODING_KITTEN,
        playerCount - 1,
    );
    const newDeck = [...deck, ...explodingKittens];
    return shuffleDeck(newDeck);
}

/**
 * Check if a card type is a Cat card
 */
export function isCatCard(type: CardType): boolean {
    return CAT_CARDS.includes(type);
}

/**
 * Check if card types are all the same
 */
export function areSameType(cards: Card[]): boolean {
    if (cards.length === 0) return false;
    return cards.every((c) => c.type === cards[0].type);
}

/**
 * Check if 5 cards are all different cat types
 */
export function areFiveDifferentCats(cards: Card[]): boolean {
    if (cards.length !== 5) return false;
    const catTypes = new Set(cards.map((c) => c.type));
    if (catTypes.size !== 5) return false;
    return cards.every((c) => isCatCard(c.type));
}
