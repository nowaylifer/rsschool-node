import { uuid } from './utils';
import type { WS } from './game-server';
import type { UserDTO } from './types';

type UserConfig = {
  name: string;
  password: string;
  ws: WS;
};

export default class User {
  readonly id: string;
  readonly name: string;
  readonly password: string;
  readonly wins: number;
  readonly ws: WS;

  constructor({ name, password, ws }: UserConfig) {
    this.id = uuid();
    this.name = name;
    this.password = password;
    this.ws = ws;
    this.wins = 0;
  }

  toDTO(): UserDTO {
    return { index: this.id, name: this.name };
  }
}
