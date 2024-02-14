import type { User } from '.';

export type ClientMessageMap = {
  reg: RegisterRequest;
  create_room: CreateRoomMessage;
};

export type ClientMessageType = keyof ClientMessageMap;

export type ClientMessage<T extends ClientMessageType = ClientMessageType> = {
  type: T;
  data: ClientMessageMap[T];
};

export type RegisterRequest = Pick<User, 'name' | 'password'>;
export type CreateRoomMessage = '';
