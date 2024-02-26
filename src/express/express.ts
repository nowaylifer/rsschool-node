import { createReadStream } from 'node:fs';
import domain from 'node:domain';
import http from 'node:http';
import { HttpMethod, Middleware, RouteHandler, ClientRequest, ServerResponse } from './types';

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
    this.middlewares = [this.domainMiddleware, this.matchRouteMiddleware];
    this.baseRoute = baseRoute;

    this.server.on('request', (req: ClientRequest, res: ServerResponse) => {
      this.attachResponseMethods(res);
      this.runMiddleware(req, res);
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
    if (middleware.beforeMatch) {
      const idx = this.middlewares.indexOf(this.matchRouteMiddleware);
      this.middlewares.splice(idx, 0, middleware as Middleware);
    } else {
      this.middlewares.push(middleware as Middleware);
    }

    return this;
  }

  get<TRequest extends ClientRequest>(path: string, cb: RouteHandler<TRequest>) {
    this.registerRoute(HttpMethod.GET, path, cb);
    return this;
  }

  post<TRequest extends ClientRequest>(path: string, cb: RouteHandler<TRequest>) {
    this.registerRoute(HttpMethod.POST, path, cb);
    return this;
  }

  put<TRequest extends ClientRequest>(path: string, cb: RouteHandler<TRequest>) {
    this.registerRoute(HttpMethod.PUT, path, cb);
    return this;
  }

  delete<TRequest extends ClientRequest>(path: string, cb: RouteHandler<TRequest>) {
    this.registerRoute(HttpMethod.DELETE, path, cb);
    return this;
  }

  private domainMiddleware: Middleware = (_req, res, next) => {
    const d = domain.create();

    res.once('finish', () => {
      d.exit();
      d.removeAllListeners();
    });

    d.once('error', () => {
      if (!res.headersSent) {
        res.status(499).error('Server error');
      }
    });

    d.run(next);
  };

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

  private attachResponseMethods(res: ServerResponse) {
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

    res.sendFile = (path) => {
      createReadStream(path).pipe(res);
    };
  }

  private matchRouteMiddleware: Middleware = (req, res, next) => {
    let reqRouteString = `${req.method?.toLocaleUpperCase()} ${req.url}`;

    if (reqRouteString.at(-1) === '/') {
      reqRouteString = reqRouteString.slice(0, -1);
    }

    const match = this.matchRoute(reqRouteString);

    if (!match) return res.status(404).error('Endpoint not found');

    req.route = match.route;
    req.params = match.params;
    req.path = this.paths[match.route];

    next();
  };

  private runMiddleware(req: ClientRequest, res: ServerResponse) {
    const run = (req: ClientRequest, res: ServerResponse, middlewares: Middleware[]) => {
      if (!middlewares.length) {
        if (req.route) this.routes[req.route](req, res);
        return;
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

export default Express;
