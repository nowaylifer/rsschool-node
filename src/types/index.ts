export * from './client-messages';
export * from './server-messages';

export type AnyMessage = {
  type: string;
  data: unknown;
};

export type UserDTO = {
  index: number;
  name: string;
};

export type RoomDTO = {
  roomId: number;
  roomUsers: UserDTO[];
};

export type WinnerDTO = {
  name: string;
  wins: number;
};
