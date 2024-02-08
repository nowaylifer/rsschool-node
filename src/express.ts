import http from 'node:http';
import { HttpMethod, JSONValue } from './types';

export type ServerResponse = http.ServerResponse<http.IncomingMessage> & {
  req: http.IncomingMessage;
} & {
  status: (code: number) => ServerResponse;
  json: (data: JSONValue) => void;
};

export type RouteHandler = (req: http.IncomingMessage, res: ServerResponse) => void;

export class Express {
  private server: http.Server;
  private routes: Record<string, RouteHandler>;

  constructor() {
    this.server = http.createServer();
    this.routes = Object.create(null);

    this.server.on('request', (req, res: ServerResponse) => {
      res.status = (code) => {
        res.statusCode = code;
        return res;
      };

      res.json = (data) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
      };

      const reqRoute = req.method!.toLocaleUpperCase() + req.url;

      if (!this.routes[reqRoute]) {
        return res.status(404).end();
      }

      this.routes[reqRoute](req, res);
    });
  }

  private route(method: HttpMethod, path: string, cb: RouteHandler) {
    this.routes[method + path] = cb;
  }

  get(path: string, cb: RouteHandler) {
    this.route(HttpMethod.GET, path, cb);
  }

  post(path: string, cb: RouteHandler) {
    this.route(HttpMethod.POST, path, cb);
  }

  put(path: string, cb: RouteHandler) {
    this.route(HttpMethod.PUT, path, cb);
  }

  delete(path: string, cb: RouteHandler) {
    this.route(HttpMethod.DELETE, path, cb);
  }

  listen(port: number, cb: () => void) {
    this.server.listen(port, cb);
  }
}

export default function express() {
  return new Express();
}
