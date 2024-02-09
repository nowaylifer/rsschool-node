import http from 'node:http';
import { HttpMethod, JSONValue } from './types';
import { match } from 'node:assert';

export type ServerResponse = http.ServerResponse<http.IncomingMessage> & {
  req: http.IncomingMessage;
} & {
  status: (code: number) => ServerResponse;
  json: (data: JSONValue) => void;
  error: (message: string) => void;
};

export type ClientRequest = http.IncomingMessage & {
  params?: Record<string, string>;
  body: unknown;
};

export type RouteHandler = (req: ClientRequest, res: ServerResponse) => void;
export type Middleware = (req: ClientRequest, res: ServerResponse, next: () => void) => void;

export class Express {
  private server: http.Server;
  private routes: Record<string, RouteHandler>;
  private middlewares: Middleware[];
  private baseRoute: string;

  constructor(baseRoute: string = '') {
    this.server = http.createServer();
    this.routes = Object.create(null);
    this.middlewares = [];
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

      const match = this.matchRoute(reqRouteString, Object.keys(this.routes));

      if (!match) return res.status(404).error('Endpoint not found');

      req.params = match.params;
      this.runMiddleware(match.route, req, res);
    });
  }

  listen(port: number, cb: () => void) {
    this.server.listen(port, cb);
  }

  use(middleware: Middleware) {
    this.middlewares.push(middleware);
  }

  get(path: string, cb: RouteHandler) {
    this.registerRoute(HttpMethod.GET, path, cb);
  }

  post(path: string, cb: RouteHandler) {
    this.registerRoute(HttpMethod.POST, path, cb);
  }

  put(path: string, cb: RouteHandler) {
    this.registerRoute(HttpMethod.PUT, path, cb);
  }

  delete(path: string, cb: RouteHandler) {
    this.registerRoute(HttpMethod.DELETE, path, cb);
  }

  private registerRoute(method: HttpMethod, path: string, cb: RouteHandler) {
    const regexpString = this.pathToRegexpString(
      `${method} /${this.baseRoute}${this.baseRoute ? '/' : ''}${path}`,
    );
    this.routes[regexpString] = cb;
  }

  private runMiddleware(route: string, req: ClientRequest, res: ServerResponse) {
    const run = (req: ClientRequest, res: ServerResponse, middlewares: Middleware[]) => {
      if (!middlewares.length) {
        return this.routes[route](req, res);
      }

      middlewares[0](req, res, () => {
        run(req, res, middlewares.slice(1));
      });
    };

    run(req, res, this.middlewares);
  }

  private matchRoute(urlPath: string, routes: string[]) {
    for (const route of routes) {
      const regexp = new RegExp(route);
      const match = urlPath.match(regexp);
      if (match) return { route, params: match.groups };
    }

    return null;
  }

  private pathToRegexpString(path: string) {
    let regexpString: string = path;

    if (path.includes(':')) {
      const paramNames = Array.from(path.matchAll(/\/:([\w_\-$]+)/g), (match) => match[1]);

      regexpString = paramNames.reduce(
        (acc, name) => acc.replace(`:${name}`, `(?<${name}>[\\w_\\-$@]+)`),
        path,
      );
    }

    return `^${regexpString}$`;
  }
}

type ExpressFn = {
  (baseRoute?: string): Express;
  json: () => Middleware;
};

const express: ExpressFn = (baseRoute?: string) => new Express(baseRoute);

express.json = () => async (req, res, next) => {
  const allowedMethods: HttpMethod[] = ['POST', 'PUT'];

  if (
    !req.headers['content-type']?.includes('application/json') ||
    !allowedMethods.includes(req.method as HttpMethod)
  ) {
    return next();
  }

  try {
    req.body = await parseJSON(req);
    next();
  } catch (error) {
    res.status(400).error((error as Error).message);
  }
};

export default express;

function parseJSON(req: ClientRequest) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString('utf-8');
    });

    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
  });
}
