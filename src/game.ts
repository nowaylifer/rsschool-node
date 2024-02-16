import { clearLine } from 'readline';
import type { AttackStatus, Position, Ship, ShipDTO } from './types';
import type User from './user';
import { uuid } from './utils';
import { randomArrayElement } from './utils';

type Player = {
  id: string;
  ready: boolean;
  board: Board;
  ships: ShipDTO[];
  user: User;
};

type Cell = { attacked: boolean; position: Position; ship?: Ship };
type Board = Cell[][];

const BOARD_SIDE_LENGTH = 10;

export default class Game {
  readonly id: string;
  readonly players: [Player, Player];
  private _currentTurnPlayer!: Player;
  private _isStarted: boolean;

  constructor(users: [User, User]) {
    this.id = uuid();
    this.players = users.map((user) => ({ id: user.id, ready: false, user })) as [Player, Player];
    this._isStarted = false;
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

  currentTurnPlayer() {
    return this._currentTurnPlayer;
  }

  playTurn(playerTurnId: Player['id'], position?: Position) {
    const targetedPlayer = this.players.find((player) => player.id !== playerTurnId)!;
    const attackPos = position ?? this.generateRandomAttackPosition(targetedPlayer.board);
    const status = this.attack(attackPos, targetedPlayer.board);

    if (status === 'miss') {
      this._currentTurnPlayer = targetedPlayer;
    }
  }

  private attack(pos: Position, board: Board): AttackStatus {
    const cell = board[pos.y][pos.x];
    cell.attacked = true;

    if (cell.ship) {
      return ++cell.ship.deadParts === cell.ship.length ? 'kill' : 'shot';
    }

    return 'miss';
  }

  private generateRandomAttackPosition(board: Board): Position {
    return { x: 1, y: 1 };
  }

  private createEmptyBoard(): Board {
    return Array(BOARD_SIDE_LENGTH)
      .fill(null)
      .map((_, yPos) =>
        Array(BOARD_SIDE_LENGTH).map((_, xPos) => ({
          position: { y: yPos, x: xPos },
          attacked: false,
        })),
      );
  }

  addShips(playerId: Player['id'], shipsDTO: ShipDTO[]) {
    const player = this.players.find((player) => player.id === playerId)!;
    const board = this.createEmptyBoard();

    player.board = shipsDTO.reduce((board, shipDTO) => {
      const ship = this.createShip(shipDTO);
      let yPos = ship.position.y;
      let xPos = ship.position.x;

      for (let i = 0; i < ship.length; i++) {
        if (ship.direction) {
          yPos += i;
        } else {
          xPos += i;
        }

        board[yPos][xPos].ship = ship;
      }

      return board;
    }, board);

    player.ready = true;
    player.ships = shipsDTO;
  }

  private createShip(shipDTO: ShipDTO) {
    const ship: Ship = Object.assign(shipDTO, { deadParts: 0 });
    return ship;
  }
}
