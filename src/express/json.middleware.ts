import type { ClientRequest, HttpMethod, Middleware } from './types';

const createJsonMiddleware: () => Middleware = () => async (req, res, next) => {
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

export default createJsonMiddleware;

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
