export * from './client-messages';
export * from './server-messages';

export type AnyMessage = {
  type: string;
  data: unknown;
};

export type UserDTO = {
  index: string;
  name: string;
};

export type RoomDTO = {
  roomId: string;
  roomUsers: UserDTO[];
};

export type WinnerDTO = {
  name: string;
  wins: number;
};
