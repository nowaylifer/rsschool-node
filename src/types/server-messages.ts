import type { RoomDTO, UserDTO, WinnerDTO } from '.';

export type ServerMessageMap = {
  reg: RegisterResponse;
  update_room: UpdateRoomsMessage;
  update_winners: UpdateWinnersMessage;
  create_game: CreateGameMessage;
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

export type RegisterResponse = UserDTO & ErrorObject;
export type UpdateWinnersMessage = WinnerDTO[];
export type UpdateRoomsMessage = RoomDTO[];
export type CreateGameMessage = {
  idGame: string;
  idPlayer: string;
};
