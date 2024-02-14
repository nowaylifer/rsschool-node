import fs from 'node:fs/promises';
import path from 'path';
import { type Middleware, HttpMethod } from './types';

const createStaticMiddleware = (pathToDir: string) => {
  const middleware: Middleware = async (req, res, next) => {
    if (req.method === HttpMethod.GET) {
      const filePath = path.join(pathToDir, req.url === '/' ? 'index.html' : req.url!);

      try {
        await fs.access(filePath);
      } catch {
        return next();
      }

      return res.status(200).sendFile(filePath);
    }

    next();
  };

  middleware.beforeMatch = true;
  return middleware;
};

export default createStaticMiddleware;
