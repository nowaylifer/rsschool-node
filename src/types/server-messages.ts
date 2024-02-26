import type { AttackStatus, Position, RoomDTO, ShipDTO, UserDTO, WinnerDTO } from '.';

export type ServerMessageMap = {
  reg: RegisterResponse;
  update_room: UpdateRoomsMessage;
  update_winners: UpdateWinnersMessage;
  create_game: CreateGameMessage;
  start_game: StartGameMessage;
  turn: TurnMessage;
  attack: AttackResponse;
  finish: FinishMessage;
};

export type ServerMessageType = keyof ServerMessageMap;

export type ServerMessage<T extends ServerMessageType = ServerMessageType> = {
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

export type RegisterResponse = (UserDTO & NoError) | HasError;
export type UpdateWinnersMessage = WinnerDTO[];
export type UpdateRoomsMessage = RoomDTO[];

export type CreateGameMessage = {
  idGame: string;
  idPlayer: string;
};

export type StartGameMessage = {
  ships: ShipDTO[];
  currentPlayerIndex: string;
};

export type TurnMessage = {
  currentPlayer: string;
};

export type AttackResponse = {
  currentPlayer: string;
  status: AttackStatus;
  position: Position;
};

export type FinishMessage = {
  winPlayer: string;
};
