import type { WS } from './game-server';
import type { UserDTO } from './types';

type IUser = {
  id: number;
  name: string;
  password: string;
  wins: number;
  ws: WS;
};

export default class User implements IUser {
  readonly id: number;
  readonly name: string;
  readonly password: string;
  readonly wins: number;
  readonly ws: WS;

  constructor({ id, name, password, ws }: Omit<IUser, 'wins'>) {
    this.id = id;
    this.name = name;
    this.password = password;
    this.ws = ws;
    this.wins = 0;
  }

  toDTO(): UserDTO {
    return { index: this.id, name: this.name };
  }
}
