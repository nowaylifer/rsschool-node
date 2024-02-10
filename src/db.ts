import { EventEmitter } from 'stream';
import { v4 as uuid } from 'uuid';
import { User } from './types';

export type UserMap = Map<string, User>;

export class UserDB {
  private map: UserMap;
  private events: EventEmitter;

  constructor(users?: User[]) {
    this.map = new Map();
    this.events = new EventEmitter();
    users?.forEach((user) => this.map.set(user.id, user));
  }

  get(key: string) {
    return this.map.get(key);
  }

  set(key: string, value: User): this {
    this.map.set(key, value);
    this.events.emit('change', this.map);
    return this;
  }

  delete(key: string): boolean {
    const existed = this.map.delete(key);
    this.events.emit('change', this.map);
    return existed;
  }

  clear() {
    this.map.clear();
    this.events.emit('change', this.map);
  }

  values() {
    return [...this.map.values()];
  }

  swap(map: Map<string, User>) {
    this.map = map;
  }

  on(...args: Parameters<EventEmitter['on']>) {
    this.events.on(...args);
  }
}

const db = new UserDB([
  { id: uuid(), username: 'nowaylifer', age: 99, hobbies: ['coding'] },
  { id: uuid(), username: 'hefty1337', age: 20, hobbies: ['video games', 'netflix'] },
]);

export default db;
