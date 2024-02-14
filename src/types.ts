export type Message = {
  type: string;
  data: unknown;
};

export type User = {
  name: string;
  password: string;
  index: number;
  wins: number;
};

export type RegisterRequest = Message & {
  type: 'reg';
  data: Pick<User, 'name' | 'password'>;
};

export type ClientMessage = RegisterRequest;

export type MessageType = RegisterRequest['type'];

export type RegisterResponse = Message & {
  type: 'reg';
  data: Pick<User, 'name' | 'index'> & ErrorObject;
};

export type UpdateRoomsMessage = Message & {
  type: 'update_room';
  data: Room[];
};

export type UpdateWinnersMessage = Message & {
  type: 'update_winners';
  data: Pick<User, 'name' | 'wins'>[];
};

export type Room = {
  roomId: number;
  roomUsers: Pick<User, 'name' | 'index'>[];
};

type ErrorObject = HasError | NoError;

type HasError = {
  error: true;
  errorText: string;
};

type NoError = {
  error: false;
};
