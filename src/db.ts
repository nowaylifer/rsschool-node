import { EventEmitter } from 'node:events';
import { User, UserMap } from './types';

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

  swap(map: UserMap) {
    this.map = map;
  }

  on(...args: Parameters<EventEmitter['on']>) {
    this.events.on(...args);
  }
}

const db = new UserDB([
  {
    id: 'f6f81776-5134-4f6f-9cef-1ab5c2283d3d',
    username: 'nowaylifer',
    age: 99,
    hobbies: ['coding'],
  },
  {
    id: 'a35ecf55-74d7-47d5-870d-3e78bdcf1c42',
    username: 'hefty1337',
    age: 20,
    hobbies: ['video games', 'netflix'],
  },
]);

export default db;
