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

export type AttackStatus = 'miss' | 'kill' | 'shot';

export type ShipDTO = {
  type: 'small' | 'medium' | 'large' | 'huge';
  direction: boolean;
  length: number;
  position: Position;
};

export type Ship = ShipDTO & {
  deadParts: number;
};
