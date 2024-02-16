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
import type Game from './game';

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
  private games: Map<Game['id'], Game>;
  private winners: WinnerDTO[];
  private clientMessageHandlers: ClientMessageHandlerMap;

  constructor(port: number, onListening?: () => void) {
    super();
    this.users = new Map();
    this.rooms = new Map();
    this.games = new Map();
    this.winners = [];
    this.clientMessageHandlers = {
      reg: this.registerUser,
      create_room: this.createRoom,
      add_user_to_room: this.addUserToRoom,
      add_ships: this.addShips,
      attack: this.handleAttack,
      randomAttack: this.handleAttack,
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

    this.on('USER_REGISTERED', (user: User, ws: WS) => {
      console.log(`User ${user.id} has registered`);
      ws.user = user;
      this.sendRooms(ws);
      this.sendWinners(ws);
    });

    this.on('ROOM_CREATED', (room: Room, user: User) => {
      console.log(`User ${user.id} has created room ${room.id}`);
      this.sendRooms();
    });

    this.on('ROOM_JOINED', (room: Room, user: User) => {
      console.log(`User ${user.id} has joined room ${room.id}`);
      this.sendRooms();
      this.createGame(room);
    });

    this.on('GAME_CREATED', (game: Game) => {
      console.log(`Game ${game.id} has been created`);
    });

    this.on('SHIPS_ADDED', (game: Game, playerId: string) => {
      console.log(`Player ${playerId} has added ships`);
      if (game.isAllReady()) {
        this.startGame(game);
      }
    });

    this.on('GAME_STARTED', (game: Game) => {
      console.log(`Game ${game.id} has been started`);
      this.updateTurn(game);
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

  private notify(message: AnyMessage, ws?: WS) {
    return ws ? this.notifyOne(message, ws) : this.notifyAll(message);
  }

  private async notifyOne<T extends AnyMessage>(message: T, ws: WS) {
    const msg: AnyMessage = { ...message, data: JSON.stringify(message.data), id: 0 };

    try {
      await retry(ws.json, 2, 200)(msg);
    } catch (error) {
      // ignore
    }
  }

  private notifyAll(message: AnyMessage) {
    const promises = [...this.server.clients].map((client) =>
      this.notifyOne(message, client as WS),
    );
    return Promise.allSettled(promises);
  }

  private async registerUser(msg: ClientMessage<'reg'>, ws: WS) {
    const newUser = new User({ ...msg.data, ws });
    const response: ServerMessage<'reg'> = {
      type: 'reg',
      data: { ...newUser.toDTO(), error: false },
    };
    await this.notify(response, ws);
    this.users.set(newUser.id, newUser);
    this.emit('USER_REGISTERED', newUser, ws);
  }

  private createRoom(_msg: ClientMessage<'create_room'>, ws: WS) {
    const room = new Room(ws.user);
    this.rooms.set(room.id, room);
    this.emit('ROOM_CREATED', room, ws.user);
  }

  private addUserToRoom(msg: ClientMessage<'add_user_to_room'>, ws: WS) {
    const room = this.rooms.get(msg.data.indexRoom)!;
    room.addUser(ws.user);
    this.emit('ROOM_JOINED', room, ws.user);
  }

  private async createGame(room: Room) {
    const game = room.createGame();
    await Promise.all(
      game.players.map((player) => {
        const msg: ServerMessage<'create_game'> = {
          type: 'create_game',
          data: {
            idGame: game.id,
            idPlayer: player.id,
          },
        };

        return this.notify(msg, player.user.ws);
      }),
    );
    this.games.set(game.id, game);
    this.emit('GAME_CREATED', game);
  }

  private addShips(msg: ClientMessage<'add_ships'>, ws: WS) {
    const game = this.games.get(msg.data.gameId)!;
    game.addShips(msg.data.indexPlayer, msg.data.ships);
    this.emit('SHIPS_ADDED', game, msg.data.indexPlayer);
  }

  private async startGame(game: Game) {
    game.start();
    await Promise.all(
      game.players.map((player) => {
        const message: ServerMessage<'start_game'> = {
          type: 'start_game',
          data: {
            ships: player.ships,
            currentPlayerIndex: player.id,
          },
        };
        this.notify(message, player.user.ws);
      }),
    );
    this.emit('GAME_STARTED', game);
  }

  private async updateTurn(game: Game) {
    const currentPlayer = game.currentTurnPlayer().id;

    await Promise.all(
      game.players.map((player) => {
        const message: ServerMessage<'turn'> = {
          type: 'turn',
          data: { currentPlayer },
        };
        this.notify(message, player.user.ws);
      }),
    );
  }

  private handleAttack(msg: ClientMessage<'attack'> | ClientMessage<'randomAttack'>, ws: WS) {
    const game = this.games.get(msg.data.gameId)!;
    const feedback = game.playTurn(msg.data.indexPlayer);
  }

  private sendRooms(ws?: WS) {
    const message: ServerMessage<'update_room'> = {
      type: 'update_room',
      data: [...this.rooms.values()]
        .filter((room) => room.userCount === 1)
        .map((room) => room.toDTO()),
    };
    return this.notify(message, ws);
  }

  private sendWinners(ws?: WS) {
    const message: ServerMessage<'update_winners'> = {
      type: 'update_winners',
      data: this.winners,
    };
    return this.notify(message, ws);
  }
}
