import Game from './game';
import type { RoomDTO } from './types';
import type User from './user';
import { uuid } from './utils';

export default class Room {
  readonly users: User[];
  readonly size = 2;
  readonly id: string;
  private _game: Game | null;

  constructor(user: User) {
    this.id = uuid();
    this.users = [user];
    this._game = null;
  }

  get game() {
    return this._game;
  }

  get userCount() {
    return this.users.length;
  }

  addUser(user: User) {
    if (this.users.length === this.size) {
      throw new Error('Cannot add a user, room is full');
    }
    this.users.push(user);
  }

  createGame() {
    const game = new Game(this.users as [User, User]);
    this._game = game;
    return game;
  }

  toDTO(): RoomDTO {
    return { roomId: this.id, roomUsers: this.users.map((u) => u.toDTO()) };
  }
}
