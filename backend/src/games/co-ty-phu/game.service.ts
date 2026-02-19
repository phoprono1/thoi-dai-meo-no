import { Injectable } from '@nestjs/common';
import {
  MonopolyRoom,
  MonopolyPlayer,
  MonopolyGameState,
  OwnedTile,
  DiceRoll,
  Card,
  CardEffect,
  BuildingCount,
  PropertyColor,
  ClientMonopolyGameState,
  ClientMonopolyPlayer,
  ClientOwnedTile,
  RoomStatus,
  STARTING_MONEY,
  GO_SALARY,
  JAIL_FINE,
  JAIL_POSITION,
  MAX_JAIL_TURNS,
  MORTGAGE_RATE,
  UNMORTGAGE_RATE,
  SELL_BUILDING_RATE,
} from './types.js';
import {
  BOARD_TILES,
  COLOR_GROUPS,
  STATION_INDICES,
  UTILITY_INDICES,
  CHANCE_CARDS,
  COMMUNITY_CARDS,
} from './board-data.js';
import { TileType } from './types.js';

const MAX_LOG = 40;

@Injectable()
export class CoTyPhuGameService {
  // ════════════════════════════════════════════
  // INITIALIZATION
  // ════════════════════════════════════════════
  initializeGame(room: MonopolyRoom): MonopolyGameState {
    const shuffledPlayers = this.shuffleArray([...room.players]);
    const turnOrder = shuffledPlayers.map((p) => p.id);

    // Reset player stats
    for (const player of room.players) {
      player.money = STARTING_MONEY;
      player.position = 0;
      player.inJail = false;
      player.jailTurns = 0;
      player.getOutOfJailCards = 0;
      player.isBankrupt = false;
    }

    const gs: MonopolyGameState = {
      players: room.players,
      turnOrder,
      currentPlayerIndex: 0,
      diceRoll: null,
      consecutiveDoubles: 0,
      pendingAction: null,
      ownedTiles: new Map(),
      chanceDeck: this.shuffleArray([...CHANCE_CARDS]),
      communityDeck: this.shuffleArray([...COMMUNITY_CARDS]),
      chanceDiscardPile: [],
      communityDiscardPile: [],
      currentCard: null,
      log: ['Trận đấu bắt đầu! Chúc mọi người vui vẻ 🎲'],
      winner: null,
      turnStartTime: Date.now(),
      turnTimeLimit: 60,
      turnTimer: null,
    };
    room.gameState = gs;
    room.status = RoomStatus.PLAYING;
    return gs;
  }

  // ════════════════════════════════════════════
  // ROLL DICE
  // ════════════════════════════════════════════
  rollDice(
    room: MonopolyRoom,
    playerId: string,
  ): { gameState: MonopolyGameState } | { error: string } {
    const gs = room.gameState!;
    const player = this.getCurrentPlayer(gs);
    if (!player || player.id !== playerId)
      return { error: 'Không phải lượt của bạn.' };
    if (gs.diceRoll !== null && gs.pendingAction === null) {
      // Already rolled this turn, player chose to roll again (doubles)
      if (!gs.diceRoll.isDouble) return { error: 'Bạn đã tung xúc xắc rồi.' };
    }
    if (gs.pendingAction !== null)
      return { error: 'Hãy xử lý hành động đang chờ trước.' };

    const dice = this.rollDice2();
    gs.diceRoll = dice;
    const diceSum = dice.die1 + dice.die2;

    this.log(
      gs,
      `${player.name} tung xúc xắc: ${dice.die1} + ${dice.die2} = ${diceSum}`,
    );

    // ── In jail ──────────────────────────────
    if (player.inJail) {
      if (dice.isDouble) {
        player.inJail = false;
        player.jailTurns = 0;
        gs.consecutiveDoubles = 0; // jail exit double doesn't chain
        this.log(gs, `${player.name} tung đôi, thoát khỏi tù!`);
        this.movePlayer(gs, player, diceSum);
        this.processLanding(room, gs, player, diceSum);
      } else {
        player.jailTurns++;
        if (player.jailTurns >= MAX_JAIL_TURNS) {
          // Force pay fine and move
          this.deductMoney(gs, player, JAIL_FINE);
          player.inJail = false;
          player.jailTurns = 0;
          this.log(
            gs,
            `${player.name} hết ${MAX_JAIL_TURNS} lượt tù, buộc phải nộp 2 triệu và di chuyển.`,
          );
          this.movePlayer(gs, player, diceSum);
          this.processLanding(room, gs, player, diceSum);
        } else {
          this.log(
            gs,
            `${player.name} không tung đôi, ở lại tù (lượt ${player.jailTurns}/${MAX_JAIL_TURNS}).`,
          );
          if (gs.pendingAction === null) this.advanceTurn(gs, room);
        }
      }
      return { gameState: gs };
    }

    // ── Normal roll ──────────────────────────
    if (dice.isDouble) {
      gs.consecutiveDoubles++;
      if (gs.consecutiveDoubles >= 3) {
        this.log(gs, `${player.name} tung đôi 3 lần liên tiếp — vào tù!`);
        this.sendToJail(gs, player);
        this.advanceTurn(gs, room);
        return { gameState: gs };
      }
    } else {
      gs.consecutiveDoubles = 0;
    }

    this.movePlayer(gs, player, diceSum);
    this.processLanding(room, gs, player, diceSum);

    // After landing: if no pending action and NOT double, auto-signal can endTurn
    // If double and no pending: player may roll again (diceRoll is set, pendingAction=null, isDouble=true)
    return { gameState: gs };
  }

  // ════════════════════════════════════════════
  // BUY PROPERTY
  // ════════════════════════════════════════════
  buyProperty(
    room: MonopolyRoom,
    playerId: string,
  ): { gameState: MonopolyGameState } | { error: string } {
    const gs = room.gameState!;
    const player = this.getCurrentPlayer(gs);
    if (!player || player.id !== playerId)
      return { error: 'Không phải lượt của bạn.' };
    if (gs.pendingAction?.type !== 'buy_property')
      return { error: 'Không có hành động mua đất.' };

    const tile = BOARD_TILES[player.position];
    const price = tile.price!;
    if (player.money < price) return { error: 'Không đủ tiền mua.' };

    player.money -= price;
    gs.ownedTiles.set(player.position, {
      tileIndex: player.position,
      ownerId: player.id,
      buildings: 0,
      isMortgaged: false,
    });
    this.log(
      gs,
      `${player.name} mua ${tile.name} với giá ${this.formatMoney(price)}.`,
    );
    gs.pendingAction = null;

    if (!gs.diceRoll?.isDouble) this.advanceTurn(gs, room);
    return { gameState: gs };
  }

  skipBuy(
    room: MonopolyRoom,
    playerId: string,
  ): { gameState: MonopolyGameState } | { error: string } {
    const gs = room.gameState!;
    const player = this.getCurrentPlayer(gs);
    if (!player || player.id !== playerId)
      return { error: 'Không phải lượt của bạn.' };
    if (gs.pendingAction?.type !== 'buy_property')
      return { error: 'Không có hành động mua đất.' };

    const tile = BOARD_TILES[player.position];
    this.log(gs, `${player.name} bỏ qua không mua ${tile.name}.`);
    gs.pendingAction = null;

    if (!gs.diceRoll?.isDouble) this.advanceTurn(gs, room);
    return { gameState: gs };
  }

  // ════════════════════════════════════════════
  // BUILD / SELL BUILDINGS
  // ════════════════════════════════════════════
  buildAction(
    room: MonopolyRoom,
    playerId: string,
    tileIndex: number,
    action: 'build' | 'sell',
  ): { gameState: MonopolyGameState } | { error: string } {
    const gs = room.gameState!;
    const player = gs.players.find((p) => p.id === playerId);
    if (!player) return { error: 'Người chơi không tồn tại.' };
    if (player.isBankrupt) return { error: 'Bạn đã phá sản.' };

    const tile = BOARD_TILES[tileIndex];
    if (!tile || tile.type !== TileType.PROPERTY)
      return { error: 'Ô không hợp lệ.' };

    const owned = gs.ownedTiles.get(tileIndex);
    if (!owned || owned.ownerId !== playerId)
      return { error: 'Bạn không sở hữu ô này.' };
    if (owned.isMortgaged) return { error: 'Ô đang bị thế chấp.' };
    if (!tile.color) return { error: 'Ô không có màu.' };
    if (!this.hasMonopoly(playerId, tile.color, gs.ownedTiles))
      return { error: 'Bạn cần sở hữu toàn bộ nhóm màu để xây nhà.' };

    const groupIndices = COLOR_GROUPS[tile.color];
    const groupBuildings = groupIndices.map(
      (i) => gs.ownedTiles.get(i)?.buildings ?? 0,
    );
    const currentBuildings = owned.buildings;

    if (action === 'build') {
      if (currentBuildings >= 5) return { error: 'Đã đạt tối đa (khách sạn).' };
      // Even build rule: can't build here if it already has more than min in group
      const minBuildings = Math.min(...groupBuildings);
      if (currentBuildings > minBuildings)
        return { error: 'Phải xây đều — xây ô khác trong nhóm trước.' };

      const buildCost =
        currentBuildings < 4 ? tile.housePrice! : tile.hotelPrice!;
      if (player.money < buildCost)
        return {
          error: `Không đủ tiền xây. Cần ${this.formatMoney(buildCost)}.`,
        };

      const isMortgagedInGroup = groupIndices.some(
        (i) => gs.ownedTiles.get(i)?.isMortgaged,
      );
      if (isMortgagedInGroup)
        return { error: 'Không thể xây khi có ô trong nhóm đang bị thế chấp.' };

      player.money -= buildCost;
      owned.buildings = (currentBuildings + 1) as BuildingCount;
      const buildType =
        owned.buildings === 5 ? 'khách sạn' : `nhà thứ ${owned.buildings}`;
      this.log(gs, `${player.name} xây ${buildType} tại ${tile.name}.`);
    } else {
      // Sell
      if (currentBuildings === 0)
        return { error: 'Không có nhà/khách sạn để bán.' };
      // Even sell rule: can't sell here if it has fewer than max in group
      const maxBuildings = Math.max(...groupBuildings);
      if (currentBuildings < maxBuildings)
        return { error: 'Phải bán đều — bán ô khác trong nhóm trước.' };

      const sellBack =
        currentBuildings === 5
          ? Math.floor(tile.hotelPrice! * SELL_BUILDING_RATE)
          : Math.floor(tile.housePrice! * SELL_BUILDING_RATE);
      player.money += sellBack;
      owned.buildings = (currentBuildings - 1) as BuildingCount;
      const soldType = currentBuildings === 5 ? 'khách sạn' : 'nhà';
      this.log(
        gs,
        `${player.name} bán ${soldType} tại ${tile.name}, thu ${this.formatMoney(sellBack)}.`,
      );
    }
    return { gameState: gs };
  }

  // ════════════════════════════════════════════
  // MORTGAGE / UNMORTGAGE
  // ════════════════════════════════════════════
  mortgageAction(
    room: MonopolyRoom,
    playerId: string,
    tileIndex: number,
    action: 'mortgage' | 'unmortgage',
  ): { gameState: MonopolyGameState } | { error: string } {
    const gs = room.gameState!;
    const player = gs.players.find((p) => p.id === playerId);
    if (!player) return { error: 'Người chơi không tồn tại.' };
    if (player.isBankrupt) return { error: 'Bạn đã phá sản.' };

    const tile = BOARD_TILES[tileIndex];
    const owned = gs.ownedTiles.get(tileIndex);
    if (!owned || owned.ownerId !== playerId)
      return { error: 'Bạn không sở hữu ô này.' };
    if (!tile.price) return { error: 'Ô không có giá.' };

    if (action === 'mortgage') {
      if (owned.isMortgaged) return { error: 'Ô đã bị thế chấp rồi.' };
      if (owned.buildings > 0)
        return { error: 'Phải bán hết nhà trước khi thế chấp.' };
      const mortgageValue = Math.floor(tile.price * MORTGAGE_RATE);
      owned.isMortgaged = true;
      player.money += mortgageValue;
      this.log(
        gs,
        `${player.name} thế chấp ${tile.name}, nhận ${this.formatMoney(mortgageValue)}.`,
      );
    } else {
      if (!owned.isMortgaged) return { error: 'Ô chưa bị thế chấp.' };
      const unmortgageCost = Math.floor(tile.price * UNMORTGAGE_RATE);
      if (player.money < unmortgageCost)
        return {
          error: `Không đủ tiền chuộc. Cần ${this.formatMoney(unmortgageCost)}.`,
        };
      owned.isMortgaged = false;
      player.money -= unmortgageCost;
      this.log(
        gs,
        `${player.name} chuộc lại ${tile.name}, trả ${this.formatMoney(unmortgageCost)}.`,
      );
    }
    return { gameState: gs };
  }

  // ════════════════════════════════════════════
  // SELL PROPERTY BACK TO BANK
  // ════════════════════════════════════════════
  sellPropertyBack(
    room: MonopolyRoom,
    playerId: string,
    tileIndex: number,
  ): { gameState: MonopolyGameState } | { error: string } {
    const gs = room.gameState!;
    const player = gs.players.find((p) => p.id === playerId);
    if (!player) return { error: 'Người chơi không tồn tại.' };
    if (player.isBankrupt) return { error: 'Bạn đã phá sản.' };

    const tile = BOARD_TILES[tileIndex];
    const owned = gs.ownedTiles.get(tileIndex);
    if (!owned || owned.ownerId !== playerId)
      return { error: 'Bạn không sở hữu ô này.' };
    if (owned.buildings > 0)
      return { error: 'Phải bán hết nhà/khách sạn trước.' };

    const sellPrice = owned.isMortgaged
      ? 0
      : Math.floor(tile.price! * MORTGAGE_RATE);
    player.money += sellPrice;
    gs.ownedTiles.delete(tileIndex);
    this.log(
      gs,
      `${player.name} bán ${tile.name} lại ngân hàng, nhận ${this.formatMoney(sellPrice)}.`,
    );

    // If was in sell_to_pay mode, check if debt cleared
    if (
      gs.pendingAction?.type === 'sell_to_pay' &&
      gs.pendingAction.playerId === playerId
    ) {
      const { amount, creditorId } = gs.pendingAction.data as {
        amount: number;
        creditorId: string | null;
      };
      if (player.money >= amount) {
        this.settleDebt(gs, player, amount, creditorId);
        gs.pendingAction = null;
        if (!gs.diceRoll?.isDouble) this.advanceTurn(gs, room);
      } else if (this.calculateNetWorth(player, gs) < amount) {
        // Can't raise enough — go bankrupt
        this.bankruptPlayer(gs, player, creditorId);
        this.advanceTurn(gs, room);
      }
    }
    return { gameState: gs };
  }

  // ════════════════════════════════════════════
  // JAIL ACTIONS
  // ════════════════════════════════════════════
  payJailFine(
    room: MonopolyRoom,
    playerId: string,
  ): { gameState: MonopolyGameState } | { error: string } {
    const gs = room.gameState!;
    const player = this.getCurrentPlayer(gs);
    if (!player || player.id !== playerId)
      return { error: 'Không phải lượt của bạn.' };
    if (!player.inJail) return { error: 'Bạn không đang ở tù.' };
    if (gs.diceRoll !== null) return { error: 'Đã tung xúc xắc rồi.' };
    if (player.money < JAIL_FINE)
      return {
        error: `Không đủ tiền nộp phạt ${this.formatMoney(JAIL_FINE)}.`,
      };

    this.deductMoney(gs, player, JAIL_FINE);
    player.inJail = false;
    player.jailTurns = 0;
    this.log(gs, `${player.name} nộp ${this.formatMoney(JAIL_FINE)} để ra tù.`);
    return { gameState: gs };
  }

  useJailCard(
    room: MonopolyRoom,
    playerId: string,
  ): { gameState: MonopolyGameState } | { error: string } {
    const gs = room.gameState!;
    const player = this.getCurrentPlayer(gs);
    if (!player || player.id !== playerId)
      return { error: 'Không phải lượt của bạn.' };
    if (!player.inJail) return { error: 'Bạn không đang ở tù.' };
    if (gs.diceRoll !== null) return { error: 'Đã tung xúc xắc rồi.' };
    if (player.getOutOfJailCards <= 0)
      return { error: 'Bạn không có thẻ thoát tù.' };

    player.getOutOfJailCards--;
    player.inJail = false;
    player.jailTurns = 0;
    this.log(gs, `${player.name} dùng thẻ thoát tù.`);
    return { gameState: gs };
  }

  // ════════════════════════════════════════════
  // END TURN
  // ════════════════════════════════════════════
  endTurn(
    room: MonopolyRoom,
    playerId: string,
  ): { gameState: MonopolyGameState } | { error: string } {
    const gs = room.gameState!;
    const player = this.getCurrentPlayer(gs);
    if (!player || player.id !== playerId)
      return { error: 'Không phải lượt của bạn.' };
    if (gs.diceRoll === null) return { error: 'Bạn chưa tung xúc xắc.' };
    if (gs.pendingAction !== null)
      return { error: 'Hãy xử lý hành động đang chờ trước.' };

    this.advanceTurn(gs, room);
    return { gameState: gs };
  }

  // ════════════════════════════════════════════
  // CLIENT STATE
  // ════════════════════════════════════════════
  toClientState(room: MonopolyRoom): ClientMonopolyGameState {
    const gs = room.gameState!;
    const current =
      gs.players[gs.turnOrder.indexOf(gs.turnOrder[gs.currentPlayerIndex])];

    const ownedTilesArr: ClientOwnedTile[] = [];
    gs.ownedTiles.forEach((v) => ownedTilesArr.push(v));

    const clientPlayers: ClientMonopolyPlayer[] = gs.players.map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      money: p.money,
      position: p.position,
      inJail: p.inJail,
      jailTurns: p.jailTurns,
      getOutOfJailCards: p.getOutOfJailCards,
      isBankrupt: p.isBankrupt,
      isDisconnected: p.isDisconnected,
    }));

    return {
      players: clientPlayers,
      turnOrder: gs.turnOrder,
      currentPlayerId: gs.turnOrder[gs.currentPlayerIndex],
      diceRoll: gs.diceRoll,
      pendingAction: gs.pendingAction,
      ownedTiles: ownedTilesArr,
      currentCard: gs.currentCard,
      log: gs.log.slice(-MAX_LOG),
      winner: gs.winner,
      turnTimeRemaining: Math.max(
        0,
        gs.turnTimeLimit - Math.floor((Date.now() - gs.turnStartTime) / 1000),
      ),
    };
  }

  // ════════════════════════════════════════════
  // PRIVATE HELPERS
  // ════════════════════════════════════════════
  private rollDice2(): DiceRoll {
    const die1 = Math.ceil(Math.random() * 6);
    const die2 = Math.ceil(Math.random() * 6);
    return { die1, die2, isDouble: die1 === die2 };
  }

  private shuffleArray<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  private movePlayer(
    gs: MonopolyGameState,
    player: MonopolyPlayer,
    steps: number,
  ): void {
    const prev = player.position;
    player.position = (player.position + steps) % 40;
    // Passed GO?
    if (player.position < prev || steps >= 40) {
      player.money += GO_SALARY;
      this.log(
        gs,
        `${player.name} qua Xuất Phát, nhận ${this.formatMoney(GO_SALARY)}.`,
      );
    }
  }

  private movePlayerTo(
    gs: MonopolyGameState,
    player: MonopolyPlayer,
    targetPos: number,
    collectGo: boolean,
  ): void {
    const prev = player.position;
    if (collectGo && targetPos <= prev) {
      player.money += GO_SALARY;
      this.log(
        gs,
        `${player.name} qua Xuất Phát, nhận ${this.formatMoney(GO_SALARY)}.`,
      );
    }
    player.position = targetPos;
  }

  private sendToJail(gs: MonopolyGameState, player: MonopolyPlayer): void {
    player.position = JAIL_POSITION;
    player.inJail = true;
    player.jailTurns = 0;
    gs.consecutiveDoubles = 0;
    gs.diceRoll = null;
    this.log(gs, `${player.name} vào tù!`);
  }

  private processLanding(
    room: MonopolyRoom,
    gs: MonopolyGameState,
    player: MonopolyPlayer,
    diceSum: number,
  ): void {
    const tile = BOARD_TILES[player.position];
    gs.currentCard = null;

    switch (tile.type) {
      case TileType.GO:
        // movePlayer already adds GO_SALARY when passing/landing on position 0.
        // Just log the landing — do NOT add salary again.
        this.log(
          gs,
          `${player.name} đáp xuống Xuất Phát (đã nhận ${this.formatMoney(GO_SALARY)}).`,
        );
        break;

      case TileType.GO_TO_JAIL:
        this.sendToJail(gs, player);
        this.advanceTurn(gs, room);
        return;

      case TileType.FREE_PARKING:
      case TileType.JAIL:
        this.log(gs, `${player.name} đến ô ${tile.name}.`);
        break;

      case TileType.TAX: {
        const tax = tile.taxAmount!;
        this.log(
          gs,
          `${player.name} nộp thuế ${tile.name}: ${this.formatMoney(tax)}.`,
        );
        this.deductOrDebt(room, gs, player, tax, null);
        break;
      }

      case TileType.CHANCE: {
        const card = this.drawCard(gs, 'chance');
        gs.currentCard = card;
        this.log(gs, `${player.name} rút Cơ Hội: "${card.text}"`);
        this.applyCard(room, gs, player, card, diceSum);
        break;
      }

      case TileType.COMMUNITY: {
        const card = this.drawCard(gs, 'community');
        gs.currentCard = card;
        this.log(gs, `${player.name} rút Khí Vận: "${card.text}"`);
        this.applyCard(room, gs, player, card, diceSum);
        break;
      }

      case TileType.PROPERTY:
      case TileType.STATION:
      case TileType.UTILITY: {
        const owned = gs.ownedTiles.get(player.position);
        if (!owned) {
          // Unowned — can buy
          this.log(
            gs,
            `${player.name} đến ${tile.name}. Muốn mua không? (${this.formatMoney(tile.price!)})`,
          );
          gs.pendingAction = {
            type: 'buy_property',
            playerId: player.id,
            data: { tileIndex: player.position, price: tile.price },
          };
        } else if (owned.ownerId !== player.id) {
          // Owned by someone else
          if (!owned.isMortgaged) {
            const owner = gs.players.find((p) => p.id === owned.ownerId);
            if (!owner || owner.isBankrupt) break;
            const rent = this.calculateRent(
              tile,
              owned,
              gs.ownedTiles,
              diceSum,
            );
            this.log(
              gs,
              `${player.name} trả tiền thuê ${tile.name} cho ${owner.name}: ${this.formatMoney(rent)}.`,
            );
            this.deductOrDebt(room, gs, player, rent, owned.ownerId);
          } else {
            this.log(gs, `${tile.name} đang thế chấp — miễn tiền thuê.`);
          }
        } else {
          this.log(gs, `${player.name} đến ${tile.name} (của mình).`);
        }
        break;
      }
    }
  }

  private calculateRent(
    tile: (typeof BOARD_TILES)[0],
    owned: OwnedTile,
    ownedTiles: Map<number, OwnedTile>,
    diceSum: number,
  ): number {
    if (tile.type === TileType.STATION) {
      const ownerStations = STATION_INDICES.filter(
        (i) => ownedTiles.get(i)?.ownerId === owned.ownerId,
      ).length;
      return tile.rent![ownerStations - 1] ?? tile.rent![0];
    }
    if (tile.type === TileType.UTILITY) {
      const ownerUtils = UTILITY_INDICES.filter(
        (i) => ownedTiles.get(i)?.ownerId === owned.ownerId,
      ).length;
      const multiplier = ownerUtils >= 2 ? 10 : 4;
      return diceSum * multiplier * 100_000; // 100k per pip per multiplier
    }
    // Property
    const buildings = owned.buildings;
    if (buildings === 0) {
      // Monopoly doubles base rent
      const isMonopoly = tile.color
        ? this.hasMonopoly(owned.ownerId, tile.color, ownedTiles)
        : false;
      return isMonopoly ? tile.rent![0] * 2 : tile.rent![0];
    }
    return tile.rent![buildings] ?? tile.rent![tile.rent!.length - 1];
  }

  private hasMonopoly(
    ownerId: string,
    color: PropertyColor,
    ownedTiles: Map<number, OwnedTile>,
  ): boolean {
    return COLOR_GROUPS[color].every(
      (i) =>
        ownedTiles.get(i)?.ownerId === ownerId &&
        !ownedTiles.get(i)?.isMortgaged,
    );
  }

  private drawCard(gs: MonopolyGameState, type: 'chance' | 'community'): Card {
    if (type === 'chance') {
      if (gs.chanceDeck.length === 0) {
        gs.chanceDeck = this.shuffleArray([...gs.chanceDiscardPile]);
        gs.chanceDiscardPile = [];
      }
      const card = gs.chanceDeck.shift()!;
      if (card.effect !== CardEffect.GET_OUT_OF_JAIL) {
        gs.chanceDiscardPile.push(card);
      }
      return card;
    } else {
      if (gs.communityDeck.length === 0) {
        gs.communityDeck = this.shuffleArray([...gs.communityDiscardPile]);
        gs.communityDiscardPile = [];
      }
      const card = gs.communityDeck.shift()!;
      if (card.effect !== CardEffect.GET_OUT_OF_JAIL) {
        gs.communityDiscardPile.push(card);
      }
      return card;
    }
  }

  private applyCard(
    room: MonopolyRoom,
    gs: MonopolyGameState,
    player: MonopolyPlayer,
    card: Card,
    diceSum: number,
  ): void {
    const activePlayers = this.getActivePlayers(gs);

    switch (card.effect) {
      case CardEffect.MOVE_TO: {
        const target = card.value!;
        this.movePlayerTo(gs, player, target, true);
        this.processLanding(room, gs, player, diceSum);
        return; // processLanding may set pendingAction
      }
      case CardEffect.MOVE_BACK: {
        const newPos = (player.position - card.value! + 40) % 40;
        player.position = newPos;
        this.processLanding(room, gs, player, diceSum);
        return;
      }
      case CardEffect.MOVE_TO_NEAREST_STATION: {
        const stations = STATION_INDICES;
        const nearest = stations.find((s) => s > player.position) ?? stations[0];
        const isStationDoubleRent = true;
        const passedGo = nearest <= player.position;
        if (passedGo) {
          player.money += GO_SALARY;
          this.log(gs, `${player.name} qua Xuất Phát, nhận ${this.formatMoney(GO_SALARY)}.`);
        }
        player.position = nearest;
        const stationOwned = gs.ownedTiles.get(nearest);
        const stationTile = BOARD_TILES[nearest];
        if (!stationOwned) {
          this.log(gs, `${player.name} đến ${stationTile.name}. Muốn mua không? (${this.formatMoney(stationTile.price!)})`);
          gs.pendingAction = { type: 'buy_property', playerId: player.id, data: { tileIndex: nearest, price: stationTile.price } };
        } else if (stationOwned.ownerId !== player.id && !stationOwned.isMortgaged) {
          const owner = gs.players.find((p) => p.id === stationOwned.ownerId);
          if (owner && !owner.isBankrupt) {
            const baseRent = this.calculateRent(stationTile, stationOwned, gs.ownedTiles, diceSum);
            const rent = isStationDoubleRent ? baseRent * 2 : baseRent;
            this.log(gs, `${player.name} trả gấp đôi tiền thuê ${stationTile.name} cho ${owner.name}: ${this.formatMoney(rent)}.`);
            this.deductOrDebt(room, gs, player, rent, stationOwned.ownerId);
          }
        } else {
          this.log(gs, `${player.name} đến ${stationTile.name}.`);
        }
        return;
      }
      case CardEffect.MOVE_TO_NEAREST_UTILITY: {
        const utils = UTILITY_INDICES;
        const nearest = utils.find((u) => u > player.position) ?? utils[0];
        const passedGo = nearest <= player.position;
        if (passedGo) {
          player.money += GO_SALARY;
          this.log(gs, `${player.name} qua Xuất Phát, nhận ${this.formatMoney(GO_SALARY)}.`);
        }
        player.position = nearest;
        const utilOwned = gs.ownedTiles.get(nearest);
        const utilTile = BOARD_TILES[nearest];
        if (!utilOwned) {
          this.log(gs, `${player.name} đến ${utilTile.name}. Muốn mua không? (${this.formatMoney(utilTile.price!)})`);
          gs.pendingAction = { type: 'buy_property', playerId: player.id, data: { tileIndex: nearest, price: utilTile.price } };
        } else if (utilOwned.ownerId !== player.id && !utilOwned.isMortgaged) {
          const owner = gs.players.find((p) => p.id === utilOwned.ownerId);
          if (owner && !owner.isBankrupt) {
            // Thẻ Cơ Hội: luôn tính xúc xắc × 10
            const rent = diceSum * 10 * 100_000;
            this.log(gs, `${player.name} trả tiền điện/nước ${utilTile.name} cho ${owner.name} (xúc xắc × 10): ${this.formatMoney(rent)}.`);
            this.deductOrDebt(room, gs, player, rent, utilOwned.ownerId);
          }
        } else {
          this.log(gs, `${player.name} đến ${utilTile.name}.`);
        }
        return;
      }
      case CardEffect.COLLECT:
        player.money += card.value!;
        break;
      case CardEffect.PAY:
        this.deductOrDebt(room, gs, player, card.value!, null);
        return;
      case CardEffect.COLLECT_FROM_PLAYERS:
        for (const other of activePlayers) {
          if (other.id === player.id) continue;
          const amount = Math.min(card.value!, other.money);
          other.money -= amount;
          player.money += amount;
        }
        break;
      case CardEffect.PAY_TO_PLAYERS: {
        const totalOwed = card.value! * (activePlayers.length - 1);
        if (player.money < totalOwed) {
          this.deductOrDebt(room, gs, player, totalOwed, null);
          return;
        }
        for (const other of activePlayers) {
          if (other.id === player.id) continue;
          player.money -= card.value!;
          other.money += card.value!;
        }
        break;
      }
      case CardEffect.GO_TO_JAIL:
        this.sendToJail(gs, player);
        this.advanceTurn(gs, room);
        return;
      case CardEffect.GET_OUT_OF_JAIL:
        player.getOutOfJailCards++;
        this.log(gs, `${player.name} nhận thẻ thoát tù.`);
        break;
      case CardEffect.HOUSE_HOTEL_TAX: {
        let tax = 0;
        gs.ownedTiles.forEach((owned) => {
          if (owned.ownerId === player.id) {
            if (owned.buildings === 5) tax += card.perHotel ?? 0;
            else tax += owned.buildings * (card.perHouse ?? 0);
          }
        });
        if (tax > 0) this.deductOrDebt(room, gs, player, tax, null);
        return;
      }
    }
  }

  /** Deduct money. If player can't afford, initiate debt resolution. */
  private deductOrDebt(
    room: MonopolyRoom,
    gs: MonopolyGameState,
    player: MonopolyPlayer,
    amount: number,
    creditorId: string | null,
  ): void {
    if (player.money >= amount) {
      this.settleDebt(gs, player, amount, creditorId);
    } else {
      const netWorth = this.calculateNetWorth(player, gs);
      if (netWorth < amount) {
        // Can never pay — go bankrupt
        this.bankruptPlayer(gs, player, creditorId);
        this.advanceTurn(gs, room);
      } else {
        // Must sell assets to pay
        gs.pendingAction = {
          type: 'sell_to_pay',
          playerId: player.id,
          data: { amount, creditorId },
        };
        this.log(
          gs,
          `${player.name} không đủ tiền (${this.formatMoney(player.money)}). Cần bán tài sản để trả ${this.formatMoney(amount)}.`,
        );
      }
    }
  }

  private settleDebt(
    gs: MonopolyGameState,
    debtor: MonopolyPlayer,
    amount: number,
    creditorId: string | null,
  ): void {
    debtor.money -= amount;
    if (creditorId) {
      const creditor = gs.players.find((p) => p.id === creditorId);
      if (creditor) creditor.money += amount;
    }
  }

  private calculateNetWorth(
    player: MonopolyPlayer,
    gs: MonopolyGameState,
  ): number {
    let worth = player.money;
    gs.ownedTiles.forEach((owned) => {
      if (owned.ownerId !== player.id) return;
      const tile = BOARD_TILES[owned.tileIndex];
      // Mortgage value of any remaining buildings
      const buildingSellback =
        owned.buildings === 5
          ? Math.floor(tile.hotelPrice! * SELL_BUILDING_RATE)
          : owned.buildings * Math.floor(tile.housePrice! * SELL_BUILDING_RATE);
      const propertyMortgage = owned.isMortgaged
        ? 0
        : Math.floor(tile.price! * MORTGAGE_RATE);
      worth += buildingSellback + propertyMortgage;
    });
    return worth;
  }

  private bankruptPlayer(
    gs: MonopolyGameState,
    player: MonopolyPlayer,
    creditorId: string | null,
  ): void {
    player.isBankrupt = true;
    this.log(gs, `💸 ${player.name} đã phá sản!`);

    // Transfer all assets to creditor or bank
    gs.ownedTiles.forEach((owned, tileIndex) => {
      if (owned.ownerId !== player.id) return;
      if (creditorId) {
        owned.ownerId = creditorId;
        owned.buildings = 0; // buildings are lost (returned to bank)
        owned.isMortgaged = false;
      } else {
        gs.ownedTiles.delete(tileIndex);
      }
    });

    // Transfer remaining money
    if (creditorId) {
      const creditor = gs.players.find((p) => p.id === creditorId);
      if (creditor) creditor.money += player.money;
    }
    player.money = 0;
    gs.pendingAction = null;
    this.checkWinner(gs);
  }

  private checkWinner(gs: MonopolyGameState): void {
    const active = this.getActivePlayers(gs);
    if (active.length <= 1) {
      gs.winner = active[0]?.id ?? gs.turnOrder[0]; // fallback: first player
      const winnerName = gs.players.find((p) => p.id === gs.winner)?.name ?? 'Unknown';
      this.log(gs, `🏆 ${winnerName} chiến thắng!`);
    }
  }

  private advanceTurn(gs: MonopolyGameState, room: MonopolyRoom): void {
    gs.diceRoll = null;
    gs.currentCard = null;
    gs.pendingAction = null;
    gs.consecutiveDoubles = 0;

    // Find next non-bankrupt player
    const total = gs.turnOrder.length;
    let next = (gs.currentPlayerIndex + 1) % total;
    let attempts = 0;
    while (attempts < total) {
      const p = gs.players.find((pl) => pl.id === gs.turnOrder[next]);
      if (p && !p.isBankrupt) break;
      next = (next + 1) % total;
      attempts++;
    }
    gs.currentPlayerIndex = next;
    gs.turnStartTime = Date.now();

    const currentPlayer = this.getCurrentPlayer(gs);
    this.log(gs, `--- Lượt của ${currentPlayer.name} ---`);
  }

  private getActivePlayers(gs: MonopolyGameState): MonopolyPlayer[] {
    return gs.players.filter((p) => !p.isBankrupt);
  }

  getCurrentPlayer(gs: MonopolyGameState): MonopolyPlayer {
    const id = gs.turnOrder[gs.currentPlayerIndex];
    return gs.players.find((p) => p.id === id)!;
  }

  private deductMoney(
    gs: MonopolyGameState,
    player: MonopolyPlayer,
    amount: number,
  ): void {
    player.money -= amount;
  }

  private log(gs: MonopolyGameState, message: string): void {
    gs.log.push(message);
    if (gs.log.length > MAX_LOG * 2) {
      gs.log = gs.log.slice(-MAX_LOG);
    }
  }

  formatMoney(amount: number): string {
    if (amount >= 1_000_000)
      return `${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)}tr`;
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}k`;
    return `${amount}đ`;
  }
}
