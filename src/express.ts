import domain from 'node:domain';
import http from 'node:http';
import { HttpMethod, Middleware, RouteHandler, ClientRequest, ServerResponse } from './types';
import { logRequest } from './utils';

export class Express {
  private server: http.Server;
  private routes: Record<string, RouteHandler>;
  private paths: Record<string, string>;
  private middlewares: Middleware[];
  private baseRoute: string;

  constructor(baseRoute: string = '') {
    this.server = http.createServer();
    this.routes = Object.create(null);
    this.paths = {};
    this.middlewares = [];
    this.baseRoute = baseRoute;

    this.server.on('request', (req: ClientRequest, res: ServerResponse) => {
      logRequest(req);

      res.status = (code) => {
        res.statusCode = code;
        return res;
      };

      res.send = (data) => {
        if (typeof data === 'object') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        } else {
          res.setHeader('Content-Type', 'text/plain');
          res.end(data);
        }
      };

      res.error = (message) => {
        res.send({ error: { status: res.statusCode, message } });
      };

      let reqRouteString = `${req.method?.toLocaleUpperCase()} ${req.url}`;

      if (reqRouteString.at(-1) === '/') {
        reqRouteString = reqRouteString.slice(0, -1);
      }

      const match = this.matchRoute(reqRouteString);

      if (!match) return res.status(404).error('Endpoint not found');

      req.params = match.params;
      req.path = this.paths[match.route];
      this.runMiddleware(match.route, req, res);
    });
  }

  listen(port: number, cb?: () => void) {
    this.server.listen(port, cb);
    return this;
  }

  close(cb?: (err?: Error | undefined) => void) {
    this.server.close(cb);
    return this;
  }

  use<TRequest extends ClientRequest>(middleware: Middleware<TRequest>) {
    this.middlewares.push(middleware as Middleware);
  }

  get<TRequest extends ClientRequest>(path: string, cb: RouteHandler<TRequest>) {
    this.registerRoute(HttpMethod.GET, path, cb);
  }

  post<TRequest extends ClientRequest>(path: string, cb: RouteHandler<TRequest>) {
    this.registerRoute(HttpMethod.POST, path, cb);
  }

  put<TRequest extends ClientRequest>(path: string, cb: RouteHandler<TRequest>) {
    this.registerRoute(HttpMethod.PUT, path, cb);
  }

  delete<TRequest extends ClientRequest>(path: string, cb: RouteHandler<TRequest>) {
    this.registerRoute(HttpMethod.DELETE, path, cb);
  }

  private registerRoute<TRequest extends ClientRequest>(
    method: HttpMethod,
    path: string,
    cb: RouteHandler<TRequest>,
  ) {
    const regexpString = this.pathToRegexpString(
      `${method} /${this.baseRoute}${this.baseRoute ? '/' : ''}${path}`,
    );
    this.routes[regexpString] = cb as RouteHandler;
    this.paths[regexpString] = path;
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

  private matchRoute(urlPath: string) {
    for (const route of Object.keys(this.routes)) {
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
  exceptions: () => Middleware;
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
  } catch (error) {
    return res.status(400).error((error as Error).message);
  }

  next();
};

express.exceptions = () => (_req, res, next) => {
  const d = domain.create();

  res.once('finish', () => {
    d.exit();
    d.removeAllListeners();
  });

  d.once('error', () => {
    if (!res.headersSent) {
      res.status(500).error('Server error');
    }
  });

  d.run(next);
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
