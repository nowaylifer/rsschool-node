import type { Room, User } from '.';

export type ServerMessageMap = {
  reg: RegisterResponse;
  update_room: UpdateRoomsMessage;
  update_winners: UpdateWinnersMessage;
};

export type ServerMessageType = keyof ServerMessageMap;

export type ServerMessage<T extends ServerMessageType> = {
  type: T;
  data: ServerMessageMap[T];
};

export type ErrorObject = HasError | NoError;

type HasError = {
  error: true;
  errorText: string;
};

type NoError = {
  error: false;
};

export type RegisterResponse = Pick<User, 'name' | 'index'> & ErrorObject;
export type UpdateRoomsMessage = Room[];
export type UpdateWinnersMessage = Pick<User, 'name' | 'wins'>[];
