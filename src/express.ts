import http from 'node:http';
import { HttpMethod, JSONValue } from './types';

export type ServerResponse = http.ServerResponse<http.IncomingMessage> & {
  req: http.IncomingMessage;
} & {
  status: (code: number) => ServerResponse;
  json: (data: JSONValue) => void;
  error: (message: string) => void;
};

export type ClientRequest = http.IncomingMessage & {
  params?: Record<string, string>;
};

export type RouteHandler = (req: ClientRequest, res: ServerResponse) => void;

export class Express {
  private server: http.Server;
  private routes: Record<string, RouteHandler>;
  private baseRoute: string;

  constructor(baseRoute: string = '') {
    this.server = http.createServer();
    this.routes = Object.create(null);
    this.baseRoute = baseRoute;

    this.server.on('request', (req: ClientRequest, res: ServerResponse) => {
      res.status = (code) => {
        res.statusCode = code;
        return res;
      };

      res.json = (data) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
      };

      res.error = (message) => {
        res.json({ error: { status: res.statusCode, message } });
      };

      let reqRouteString = `${req.method!.toLocaleUpperCase()} ${req.url}`;

      if (reqRouteString.at(-1) === '/') {
        reqRouteString = reqRouteString.slice(0, -1);
      }

      const match = matchRoute(reqRouteString, Object.keys(this.routes));

      if (!match) {
        return res.status(404).error('Endpoint not found');
      }

      req.params = match.params;
      this.routes[match.route](req, res);
    });
  }

  listen(port: number, cb: () => void) {
    this.server.listen(port, cb);
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

  private route(method: HttpMethod, path: string, cb: RouteHandler) {
    const regexpString = pathToRegexpString(
      `${method} /${this.baseRoute}${this.baseRoute ? '/' : ''}${path}`,
    );
    this.routes[regexpString] = cb;
  }
}

export default function express(baseRoute?: string) {
  return new Express(baseRoute);
}

export function pathToRegexpString(path: string) {
  let regexpString: string = path;

  if (path.includes(':')) {
    const paramNames = Array.from(path.matchAll(/\/:([\w_\-$]+)/g), (match) => match[1]);

    regexpString = paramNames.reduce(
      (acc, name) => acc.replace(`:${name}`, `(?<${name}>[\\w_\\-$@]+)`),
      path,
    );
  }

  return regexpString + '$';
}

function matchRoute(urlPath: string, routes: string[]) {
  for (const route of routes) {
    const regexp = new RegExp(route);
    const match = urlPath.match(regexp);

    if (match) {
      return { route, params: match.groups };
    }
  }

  return null;
}
