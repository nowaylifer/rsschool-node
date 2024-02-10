import http from 'node:http';

export type JSONValue = string | number | boolean | { [x: string]: JSONValue } | JSONValue[];

export type HttpMethod = (typeof HttpMethod)[keyof typeof HttpMethod];
export const HttpMethod = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
} as const;

export type User = {
  id: string;
  username: string;
  age: number;
  hobbies: string[];
};

export type UserDraft = Omit<User, 'id'>;

export type UserMap = Map<string, User>;

export type ClientRequest = http.IncomingMessage & {
  params?: Record<string, string>;
  path: string;
  body: unknown;
};

export type RequestWithUser = ClientRequest & {
  user: User;
};

export type RouteHandler<TRequest extends ClientRequest = ClientRequest> = (
  req: TRequest,
  res: ServerResponse,
) => void;

export type Middleware<TRequest extends ClientRequest = ClientRequest> = (
  req: TRequest,
  res: ServerResponse,
  next: () => void,
) => void;

export type ServerResponse = http.ServerResponse<http.IncomingMessage> & {
  req: http.IncomingMessage;
} & {
  status: (code: number) => ServerResponse;
  send: (data: JSONValue) => void;
  error: (message: string) => void;
};
