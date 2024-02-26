import type { ShipDTO } from '.';

export type ClientMessageMap = {
  reg: RegisterRequest;
  create_room: CreateRoomMessage;
  add_user_to_room: AddUserToRoomMessage;
  add_ships: AddShipsMessage;
  attack: AttackRequest;
  randomAttack: RandomAttackRequest;
  single_play: StartSinglePlay;
};

export type ClientMessageType = keyof ClientMessageMap;

export type ClientMessage<T extends ClientMessageType = ClientMessageType> = {
  type: T;
  data: ClientMessageMap[T];
};

export type RegisterRequest = {
  name: string;
  password: string;
};

export type CreateRoomMessage = '';

export type AddUserToRoomMessage = { indexRoom: string };

export type AddShipsMessage = {
  gameId: string;
  indexPlayer: string;
  ships: ShipDTO[];
};

export type AttackRequest = {
  gameId: string;
  indexPlayer: string;
  x: number;
  y: number;
};

export type RandomAttackRequest = {
  gameId: string;
  indexPlayer: string;
};

export type StartSinglePlay = '';
