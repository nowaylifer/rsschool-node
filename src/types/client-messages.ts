export type ClientMessageMap = {
  reg: RegisterRequest;
  create_room: CreateRoomMessage;
  add_user_to_room: AddUserToRoom;
};

export type ClientMessageType = keyof ClientMessageMap;

export type ClientMessage<T extends ClientMessageType = ClientMessageType> = {
  type: T;
  data: ClientMessageMap[T];
};

export type RegisterRequest = {
  name: string;
  password: string;
};
export type CreateRoomMessage = '';
export type AddUserToRoom = { indexRoom: number };
