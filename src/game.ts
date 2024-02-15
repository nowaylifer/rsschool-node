import type User from './user';
import { v4 as uuid } from 'uuid';

type Player = {
  id: string;
  user: User;
};

export default class Game {
  readonly id: string;
  readonly players: [Player, Player];

  constructor(users: [User, User]) {
    this.id = uuid();
    this.players = users.map((user, idx) => ({ id: user.id, user })) as [Player, Player];
  }
}
