import { WebSocketServer, type Server, WebSocket } from 'ws';
import { EventEmitter } from 'node:events';
import { promisify } from 'util';
import type { AnyMessage, ServerMessage, ClientMessage, ClientMessageType } from './types';
import type { Player, TurnResult } from './game';
import botShips from './bot-ships.json';
import {
  createAttackResponse,
  createMockWS,
  createRegisterResponse,
  isPosition,
  randomArrayElement,
  retry,
} from './utils';
import User from './user';
import Room from './room';
import Game from './game';
import Ship from './ship';

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
  private winners: Set<User>;
  private clientMessageHandlers: ClientMessageHandlerMap;

  constructor(port: number, onListening?: () => void) {
    super();
    this.users = new Map();
    this.rooms = new Map();
    this.games = new Map();
    this.winners = new Set();

    this.clientMessageHandlers = {
      reg: this.registerUser,
      create_room: this.createRoom,
      add_user_to_room: this.addUserToRoom,
      add_ships: this.addShips,
      attack: this.handleGameTurn,
      randomAttack: this.handleGameTurn,
      single_play: this.startSinglePlayerGame,
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

    this.on('USER_REGISTERED', (user: User, ws: WS, existed: boolean) => {
      if (existed) {
        console.log(`User ${user.id} has logged in`);
      } else {
        console.log(`User ${user.id} has registered`);
      }

      ws.user = user;
      user.connectWS(ws);
      this.updateRooms(ws);
      this.updateWinners(ws);
    });

    this.on('ROOM_CREATED', (room: Room, user: User) => {
      console.log(`User ${user.id} has created room ${room.id}`);
      this.updateRooms();
    });

    this.on('ROOM_JOINED', async (room: Room, user: User) => {
      console.log(`User ${user.id} has joined room ${room.id}`);
      await this.createGame(room);
      this.rooms.delete(room.id);
      this.updateRooms();
    });

    this.on('GAME_CREATED', (game: Game) => {
      console.log(`Game ${game.id} has been created`);
    });

    this.on('SHIPS_ADDED', (game: Game, playerId: string) => {
      console.log(`Game: ${game.id}: player ${playerId} has added ships`);
      if (game.isAllReady()) {
        this.startGame(game);
      }
    });

    this.on('GAME_STARTED', (game: Game) => {
      console.log(`Game ${game.id} has been started`);
      this.updateTurn(game);
    });

    this.on('GAME_TURN_STARTED', (game: Game) => {
      console.log(`Game ${game.id}: player ${game.currentTurnPlayer.id} is making their turn`);
    });

    this.on('GAME_TURN_FINISHED', (game: Game) => {
      console.log(
        `Game ${game.id}: player ${game.lastTurnResult?.player.id} has attacked position { x: ${game.lastTurnResult?.position.x}, y: ${game.lastTurnResult?.position.y} }\nResult: ${game.lastTurnResult?.status}`,
      );

      if (game.isFinished()) {
        this.finishGame(game);
      } else {
        this.updateTurn(game);
      }
    });

    this.on('GAME_FINISHED', (game: Game) => {
      const { user } = game.winner!;
      console.log(`Game ${game.id} has finished. Winner: user ${user.id}`);
      user.increaseWins();
      this.winners.add(user);
      this.updateWinners();
    });
  }

  async close() {
    this.server.clients.forEach((ws) => ws.close());
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

  private notifyGamePlayers<T extends ServerMessage>(
    game: Game,
    message: T | ((player: Player) => T),
  ) {
    return Promise.all(
      game.players.map((player) =>
        this.notify(typeof message === 'function' ? message(player) : message, player.user.ws),
      ),
    );
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

  private async startSinglePlayerGame(_msg: ClientMessage<'single_play'>, ws: WS) {
    const bot = new User('bot', 'bot');
    bot.connectWS(createMockWS());

    const room = new Room(ws.user);
    room.addUser(bot);

    const game = await this.createGame(room);

    const ships = randomArrayElement(botShips);

    this.addShips({
      type: 'add_ships',
      data: { gameId: game.id, indexPlayer: bot.id, ships },
    });

    game.on('TURN_FINISHED', () => {
      if (game.currentTurnPlayer.id === bot.id) {
        setTimeout(() => {
          this.handleGameTurn({
            type: 'randomAttack',
            data: { gameId: game.id, indexPlayer: bot.id },
          });
        }, 1000);
      }
    });
  }

  private async registerUser(msg: ClientMessage<'reg'>, ws: WS) {
    const users = [...this.users.values()];
    const existingUser = users.find((user) => user.name === msg.data.name);

    if (existingUser && existingUser.password !== msg.data.password) {
      return this.notify(createRegisterResponse({ error: true, errorText: 'Wrong password' }), ws);
    }

    let user;

    if (existingUser) {
      await this.notify(createRegisterResponse({ ...existingUser.toDTO(), error: false }), ws);
      user = existingUser;
    } else {
      const newUser = new User(msg.data.name, msg.data.password);
      await this.notify(createRegisterResponse({ ...newUser.toDTO(), error: false }), ws);
      this.users.set(newUser.id, newUser);
      user = newUser;
    }

    this.emit('USER_REGISTERED', user, ws, !!existingUser);
  }

  private createRoom(_msg: ClientMessage<'create_room'>, ws: WS) {
    const room = new Room(ws.user);
    this.rooms.set(room.id, room);
    this.emit('ROOM_CREATED', room, ws.user);
  }

  private addUserToRoom(msg: ClientMessage<'add_user_to_room'>, ws: WS) {
    const room = this.rooms.get(msg.data.indexRoom)!;

    if (room.users.find((u) => u.id === ws.user.id)) {
      return;
    }

    room.addUser(ws.user);
    this.emit('ROOM_JOINED', room, ws.user);
  }

  private async createGame(room: Room) {
    const game = room.createGame();
    await this.notifyGamePlayers(game, (player) => ({
      type: 'create_game',
      data: {
        idGame: game.id,
        idPlayer: player.id,
      },
    }));
    this.games.set(game.id, game);
    this.emit('GAME_CREATED', game);
    return game;
  }

  private addShips(msg: ClientMessage<'add_ships'>) {
    const game = this.games.get(msg.data.gameId)!;
    game.addShips(
      msg.data.indexPlayer,
      msg.data.ships.map((dto) => new Ship(dto)),
    );
    this.emit('SHIPS_ADDED', game, msg.data.indexPlayer);
  }

  private async startGame(game: Game) {
    game.start();
    await this.notifyGamePlayers(game, (player) => ({
      type: 'start_game',
      data: {
        ships: player.ships.map((ship) => ship.toDTO()),
        currentPlayerIndex: player.id,
      },
    }));
    this.emit('GAME_STARTED', game);
  }

  private async updateTurn(game: Game) {
    await this.notifyGamePlayers(game, () => ({
      type: 'turn',
      data: { currentPlayer: game.currentTurnPlayer.id },
    }));
    this.emit('GAME_TURN_STARTED', game);
  }

  private async finishGame(game: Game) {
    await this.notifyGamePlayers(game, () => ({
      type: 'finish',
      data: {
        winPlayer: game.winner!.id,
      },
    }));
    this.emit('GAME_FINISHED', game);
  }

  private async handleGameTurn(msg: ClientMessage<'attack'> | ClientMessage<'randomAttack'>) {
    const game = this.games.get(msg.data.gameId)!;

    let turnResult: TurnResult;

    try {
      turnResult = game.playTurn(
        msg.data.indexPlayer,
        isPosition(msg.data) ? { y: msg.data.y, x: msg.data.x } : undefined,
      );
    } catch (error) {
      return;
    }

    const { status, position } = turnResult;
    const response = createAttackResponse(turnResult.player.id);

    if (status === 'killed') {
      const { ship } = turnResult;

      await Promise.all(
        ship.ownCells.map((cell) =>
          this.notifyGamePlayers(game, response('killed', cell.position)),
        ),
      );

      await Promise.all(
        ship.neighbourCells
          .filter((cell) => !cell.attacked)
          .map((cell) => this.notifyGamePlayers(game, response('miss', cell.position))),
      );

      ship.neighbourCells.forEach((cell) => (cell.attacked = true));
    } else {
      await this.notifyGamePlayers(game, response(status, position));
    }

    this.emit('GAME_TURN_FINISHED', game);
  }

  private updateRooms(ws?: WS) {
    const message: ServerMessage<'update_room'> = {
      type: 'update_room',
      data: [...this.rooms.values()]
        .filter((room) => room.userCount === 1)
        .map((room) => room.toDTO()),
    };
    return this.notify(message, ws);
  }

  private updateWinners(ws?: WS) {
    const message: ServerMessage<'update_winners'> = {
      type: 'update_winners',
      data: [...this.winners.values()].map(({ name, wins }) => ({ name, wins })),
    };
    return this.notify(message, ws);
  }
}
