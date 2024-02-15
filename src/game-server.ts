import { WebSocketServer, type Server, type WebSocket } from 'ws';
import { EventEmitter } from 'node:events';
import { promisify } from 'util';
import { retry } from './utils';
import type {
  AnyMessage,
  ServerMessage,
  ClientMessage,
  ClientMessageType,
  WinnerDTO,
} from './types';
import User from './user';
import Room from './room';

export type WS = WebSocket & {
  json(value: unknown): Promise<void>;
  sendPromises(data: string): Promise<void>;
  user: User;
};

type ClientMessageHandlerMap = {
  [T in ClientMessageType]: (message: ClientMessage<T>, ws: WS) => void;
};

export default class GameServer extends EventEmitter {
  static listen(port: number, onListening?: () => void) {
    return new this(port, onListening);
  }

  private server: Server;
  private users: Map<User['id'], User>;
  private rooms: Map<Room['id'], Room>;
  private winners: WinnerDTO[];
  private clientMessageHandlers: ClientMessageHandlerMap;

  constructor(port: number, onListening?: () => void) {
    super();
    this.users = new Map();
    this.rooms = new Map();
    this.winners = [];
    this.clientMessageHandlers = {
      reg: this.register,
      create_room: this.createRoom,
      add_user_to_room: this.addUserToRoom,
    };

    this.server = new WebSocketServer({ port });

    if (onListening) {
      this.server.on('listening', onListening);
    }

    this.server.on('connection', (ws: WS) => {
      console.log('Connected new client');
      ws.sendPromises = promisify(ws.send);
      ws.json = (value) => ws.sendPromises(JSON.stringify(value));

      ws.on('message', (message: string) => {
        const msg = this.parseClientMessage(message);
        this.handleClientMessage(msg, ws);
      });
    });

    this.on('REGISTER_USER', async (user: User) => {
      console.log(`User ${user.name} has registered`);
      await this.sendRooms(user.ws);
      await this.sendWinners(user.ws);
    });

    this.on('CREATE_ROOM', async (room: Room, user: User) => {
      console.log(`User ${user.name} has created room ${room.id}`);
      await this.sendRooms();
    });

    this.on('JOIN_ROOM', async (room: Room, user: User) => {
      console.log(`User ${user.name} has joined room ${room.id}`);
      await Promise.all(room.users.map(({ ws }) => this.sendRooms(ws)));
    });
  }

  private parseClientMessage(message: string) {
    const body = JSON.parse(message) as AnyMessage;

    let data;

    try {
      data = JSON.parse(body.data as string);
    } catch {
      data = '';
    }

    return { ...body, data } as ClientMessage;
  }

  private handleClientMessage<T extends ClientMessageType>(message: ClientMessage<T>, ws: WS) {
    this.clientMessageHandlers[message.type].call(this, message, ws);
  }

  private async notify<T extends AnyMessage>(message: T, ws: WS) {
    const msg: AnyMessage = { ...message, data: JSON.stringify(message.data), id: 0 };

    try {
      await retry(ws.json, 2, 200)(msg);
    } catch (error) {
      // ignore
    }
  }

  private notifyAll(message: AnyMessage) {
    const promises = [...this.server.clients].map((client) => this.notify(message, client as WS));
    return Promise.allSettled(promises);
  }

  private async register(msg: ClientMessage<'reg'>, ws: WS) {
    const newUser = new User({ ...msg.data, id: this.users.size, ws });
    this.users.set(newUser.id, newUser);
    ws.user = newUser;
    const response: ServerMessage<'reg'> = {
      type: 'reg',
      data: { ...newUser.toDTO(), error: false },
    };
    await this.notify(response, ws);
    this.emit('REGISTER_USER', newUser);
  }

  private async createRoom(_msg: ClientMessage<'create_room'>, ws: WS) {
    const room = new Room({ id: this.rooms.size, users: [ws.user] });
    this.rooms.set(room.id, room);
    this.emit('CREATE_ROOM', room, ws.user);
  }

  private async addUserToRoom(msg: ClientMessage<'add_user_to_room'>, ws: WS) {
    const room = this.rooms.get(msg.data.indexRoom)!;
    room.addUser(ws.user);
    this.emit('JOIN_ROOM', room, ws.user);
  }

  private sendRooms(ws?: WS) {
    const message: ServerMessage<'update_room'> = {
      type: 'update_room',
      data: [...this.rooms.values()].map((room) => room.toDTO()),
    };
    return ws ? this.notify(message, ws) : this.notifyAll(message);
  }

  private sendWinners(ws?: WS) {
    const message: ServerMessage<'update_winners'> = {
      type: 'update_winners',
      data: this.winners,
    };
    return ws ? this.notify(message, ws) : this.notifyAll(message);
  }
}
