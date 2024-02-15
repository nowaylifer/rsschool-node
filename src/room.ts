import Game from './game';
import type { RoomDTO } from './types';
import type User from './user';

type IRoom = {
  size?: number;
  users?: User[];
  id: number;
};

export default class Room implements IRoom {
  readonly users: User[];
  readonly size: number;
  readonly id: number;
  private _game: Game | null;

  constructor({ id, size = 2, users = [] }: IRoom) {
    this.id = id;
    this.users = users;
    this.size = size;
    this._game = null;
  }

  get game() {
    return this._game;
  }

  addUser(user: User) {
    if (this.users.length === this.size) {
      throw new Error('Cannot add a user, room is full');
    }
    this.users.push(user);
  }

  startGame() {
    this._game = new Game(this.users[0], this.users[1]);
  }

  toDTO(): RoomDTO {
    return { roomId: this.id, roomUsers: this.users.map((u) => u.toDTO()) };
  }
}
