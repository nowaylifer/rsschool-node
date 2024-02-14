export * from './client-messages';
export * from './server-messages';

export type AnyMessage = {
  type: string;
  data: unknown;
};

export type User = {
  name: string;
  password: string;
  index: number;
  wins: number;
};

export type Room = {
  roomId: number;
  roomUsers: Pick<User, 'name' | 'index'>[];
};
