import type { WS } from './game-server';
import type { UserDTO } from './types';
import { uuid } from './utils';

export default class User {
  readonly id: string;
  readonly name: string;
  readonly password: string;
  private _wins: number;
  private _ws!: WS;

  constructor(name: string, password: string) {
    this.id = uuid();
    this.name = name;
    this.password = password;
    this._wins = 0;
  }

  connectWS(ws: WS) {
    this._ws = ws;
  }

  get ws() {
    return this._ws;
  }

  get wins() {
    return this._wins;
  }

  increaseWins(value: number = 1) {
    this._wins += value;
  }

  toDTO(): UserDTO {
    return { index: this.id, name: this.name };
  }
}
