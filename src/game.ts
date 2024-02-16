import type { AttackStatus, Position } from './types';
import type User from './user';
import { uuid } from './utils';
import { randomArrayElement } from './utils';
import type Ship from './ship';

export type Player = {
  id: string;
  ready: boolean;
  board: Board;
  ships: Ship[];
  liveShips: number;
  user: User;
};

type WithShip = {
  status: Exclude<AttackStatus, 'miss'>;
  ship: Ship;
};

type NoShip = {
  status: Extract<AttackStatus, 'miss'>;
};

type AttackResult = WithShip | NoShip;

export type TurnResult = AttackResult & {
  player: Player;
  position: Position;
};

export type Cell = { attacked: boolean; position: Position; ship?: Ship };
export type Board = Cell[][];

const BOARD_SIDE_LENGTH = 10;
const PLAYER_SHIP_COUNT = 10;

export default class Game {
  readonly id: string;
  readonly players: [Player, Player];
  private _currentTurnPlayer!: Player;
  private _isStarted: boolean;
  private _isFinished: boolean;
  private _winner: Player | null;
  private _lastTurnResult?: TurnResult;

  constructor(users: [User, User]) {
    this.id = uuid();
    this.players = users.map((user) => ({ id: user.id, ready: false, user })) as [Player, Player];
    this._isStarted = false;
    this._winner = null;
    this._isFinished = false;
  }

  start() {
    this._isStarted = true;
    this._currentTurnPlayer = randomArrayElement(this.players);
  }

  isStarted() {
    return this._isStarted;
  }

  isAllReady() {
    return this.players.every((player) => player.ready);
  }

  get lastTurnResult() {
    return this._lastTurnResult;
  }

  get currentTurnPlayer() {
    return this._currentTurnPlayer;
  }

  private isPlayerLost(player: Player) {
    return !player.liveShips;
  }

  get winner() {
    return this._winner;
  }

  isFinished() {
    return this._isFinished;
  }

  playTurn(playerTurnId: Player['id'], position?: Position) {
    const player = this.players.find((player) => player.id === playerTurnId)!;
    const targetedPlayer = this.players.find((player) => player.id !== playerTurnId)!;

    if (player !== this.currentTurnPlayer) {
      throw new Error(`Not the player ${playerTurnId} turn`);
    }

    if (position && targetedPlayer.board[position.y][position.x].attacked) {
      throw new Error('Cell is already attacked');
    }

    const attackPosition = position ?? this.generateRandomAttackPosition(targetedPlayer.board);

    const { status, ship } = this.attack(attackPosition, targetedPlayer);
    const finish = this.isPlayerLost(targetedPlayer);

    if (finish) {
      this._isFinished = true;
      this._winner = player;
    }

    if (status === 'miss' && !finish) {
      this._currentTurnPlayer = targetedPlayer;
    }

    const turnResult = {
      player,
      status,
      ship,
      position: attackPosition,
    } as TurnResult;

    this._lastTurnResult = turnResult;

    return turnResult;
  }

  private attack(pos: Position, targetPlayer: Player) {
    const cell = targetPlayer.board[pos.y][pos.x];
    cell.attacked = true;

    if (cell.ship) {
      const shipDefeated = cell.ship.hit();

      if (shipDefeated) {
        --targetPlayer.liveShips;
      }

      return { ship: cell.ship, status: shipDefeated ? 'killed' : 'shot' };
    }

    return { status: 'miss' };
  }

  private generateRandomAttackPosition(board: Board): Position {
    const notAttackedCells = board.flat().filter((cell) => !cell.attacked);
    const randomCell = randomArrayElement(notAttackedCells);
    return randomCell.position;
  }

  private createEmptyBoard(): Board {
    return Array(BOARD_SIDE_LENGTH)
      .fill(null)
      .map((_, yPos) =>
        Array(BOARD_SIDE_LENGTH)
          .fill(null)
          .map((_, xPos) => ({
            position: { y: yPos, x: xPos },
            attacked: false,
          })),
      );
  }

  addShips(playerId: Player['id'], ships: Ship[]) {
    const player = this.players.find((player) => player.id === playerId)!;

    player.board = ships.reduce((board, ship) => {
      let yPos = { cur: ship.position.y };
      let xPos = { cur: ship.position.x };
      let deltaPos = ship.vertical ? yPos : xPos;

      for (let i = 0; i < ship.length; i++) {
        const cell = board[yPos.cur][xPos.cur];
        cell.ship = ship;
        ship.setOwnCell(cell);
        ++deltaPos.cur;
      }

      return board;
    }, this.createEmptyBoard());

    ships.forEach((ship) => ship.setNeighbourCells(player.board));

    player.ready = true;
    player.ships = ships;
    player.liveShips = PLAYER_SHIP_COUNT;
  }
}
