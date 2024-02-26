import http from 'node:http';
import type { Express } from './express';

export type JSONValue = string | number | boolean | { [x: string]: JSONValue } | JSONValue[];

export type HttpMethod = (typeof HttpMethod)[keyof typeof HttpMethod];
export const HttpMethod = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
} as const;

export type ClientRequest = http.IncomingMessage & {
  params?: Record<string, string>;
  path: string;
  body: unknown;
  route: string;
};

export type RouteHandler<TRequest extends ClientRequest = ClientRequest> = (
  req: TRequest,
  res: ServerResponse,
) => void;

export type Middleware<TRequest extends ClientRequest = ClientRequest> = {
  (req: TRequest, res: ServerResponse, next: () => void): void;
  beforeMatch?: boolean;
};

export type ServerResponse = http.ServerResponse<http.IncomingMessage> & {
  req: http.IncomingMessage;
} & {
  status: (code: number) => ServerResponse;
  send: (data: JSONValue) => void;
  sendFile: (path: string) => void;
  error: (message: string) => void;
};

export type ExpressFn = {
  (baseRoute?: string): Express;
  static: (path: string) => Middleware;
  log: () => Middleware;
  json: () => Middleware;
};
