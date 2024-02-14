import { type Server, WebSocketServer, type WebSocket } from 'ws';
import { promisify } from 'util';
import { retry } from './utils';
import type {
  User,
  Room,
  AnyMessage,
  ServerMessage,
  ClientMessage,
  ClientMessageType,
} from './types';

type WebSocketExtended = WebSocket & {
  json(value: unknown): Promise<void>;
  sendPromises(data: string): Promise<void>;
};

type MessageHandlerMap = {
  [T in ClientMessageType]: (message: ClientMessage<T>, ws: WebSocketExtended) => void;
};

export default class GameServer {
  static listen(port: number, onListening?: () => void) {
    return new this(port, onListening);
  }

  private server: Server;
  private users: User[];
  private rooms: Room[];
  private winners: Pick<User, 'name' | 'wins'>[];
  private messageHandlers: MessageHandlerMap;

  constructor(port: number, onListening?: () => void) {
    this.users = [];
    this.rooms = [];
    this.winners = [];
    this.messageHandlers = { reg: this.register, create_room: this.createRoom };
    this.server = new WebSocketServer({ port });

    if (onListening) {
      this.server.on('listening', onListening);
    }

    this.server.on('connection', (ws: WebSocketExtended) => {
      console.log('new client connected');
      ws.sendPromises = promisify(ws.send);
      ws.json = (value) => ws.sendPromises(JSON.stringify(value));

      ws.on('message', (message: string) => {
        const body = JSON.parse(message) as AnyMessage;
        const data = JSON.parse(body.data as string);
        const msg = { ...body, data } as ClientMessage;
        this.handleClientMessage(msg, ws);
      });
    });
  }

  private handleClientMessage<T extends ClientMessageType>(
    message: ClientMessage<T>,
    ws: WebSocketExtended,
  ) {
    this.messageHandlers[message.type](message, ws);
  }

  private async sendMessage<T extends AnyMessage>(message: T, ws: WebSocketExtended) {
    const msg: AnyMessage = { ...message, data: JSON.stringify(message.data), id: 0 };

    try {
      await retry(ws.json, 2, 200)(msg);
    } catch (error) {
      // ignore
    }
  }

  private async register(message: ClientMessage<'reg'>, ws: WebSocketExtended) {
    const newUser = { ...message.data, index: this.users.length, wins: 0 };
    this.users.push(newUser);
    const response: ServerMessage<'reg'> = { type: 'reg', data: { ...newUser, error: false } };
    await this.sendMessage(response, ws);
    await this.sendRooms(ws);
    await this.sendWinners(ws);
  }

  private createRoom() {
    this.rooms.push({ roomId: this.rooms.length, roomUsers: [] });
  }

  private sendRooms(ws: WebSocketExtended) {
    const message: ServerMessage<'update_room'> = {
      type: 'update_room',
      data: this.rooms,
    };
    return this.sendMessage(message, ws);
  }

  private sendWinners(ws: WebSocketExtended) {
    const message: ServerMessage<'update_winners'> = {
      type: 'update_winners',
      data: this.winners,
    };
    return this.sendMessage(message, ws);
  }
}
