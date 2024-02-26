import type { Middleware } from './types';

const createLogMiddleware = () => {
  const middleware: Middleware = (req, _res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  };
  middleware.beforeMatch = true;
  return middleware;
};

export default createLogMiddleware;
