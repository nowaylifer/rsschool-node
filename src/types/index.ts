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

export type Position = {
  x: number;
  y: number;
};

export type AttackStatus = 'miss' | 'killed' | 'shot';

export type ShipDTO = {
  type: string;
  direction: boolean;
  length: number;
  position: Position;
};
