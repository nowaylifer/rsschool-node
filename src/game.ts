import type User from './user';

export default class Game {
  private p1: User;
  private p2: User;

  constructor(p1: User, p2: User) {
    this.p1 = p1;
    this.p2 = p2;
  }
}
