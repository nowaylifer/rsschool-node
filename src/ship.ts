import type { Board, Cell } from './game';
import type { Position, ShipDTO } from './types';

export default class Ship {
  readonly type: string;
  readonly vertical: boolean;
  readonly length: number;
  readonly position: Position;

  private deadParts: number;
  private dto: ShipDTO;
  private _neightbourCells: Cell[];
  private _ownCells: Cell[];

  constructor(dto: ShipDTO) {
    this.dto = dto;
    this.type = dto.type;
    this.length = dto.length;
    this.vertical = dto.direction;
    this.position = dto.position;
    this.deadParts = 0;
    this._neightbourCells = [];
    this._ownCells = [];
  }

  hit() {
    this.deadParts++;
    return this.defeated;
  }

  setOwnCell(cell: Cell) {
    this._ownCells.push(cell);
  }

  setNeighbourCells(board: Board) {
    const xPos = this.position.x;
    const yPos = this.position.y;

    const maxCol = this.vertical ? xPos + 1 : xPos + this.length;
    const maxRow = this.vertical ? yPos + this.length : yPos + 1;

    for (let row = yPos - 1; row <= maxRow; row++) {
      for (let col = xPos - 1; col <= maxCol; col++) {
        const cell = board[row]?.[col];
        if (cell && !cell.ship) this._neightbourCells.push(cell);
      }
    }
  }

  get neighbourCells() {
    return this._neightbourCells;
  }

  get ownCells() {
    return this._ownCells;
  }

  get defeated() {
    return this.length === this.deadParts;
  }

  toDTO() {
    return this.dto;
  }
}
