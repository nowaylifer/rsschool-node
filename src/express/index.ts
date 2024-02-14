import type { ExpressFn } from './types';
import createStaticMiddleware from './static.middleware';
import createJsonMiddleware from './json.middleware';
import createLogMiddleware from './log.middleware';
import Express from './express';

const express: ExpressFn = (baseUrl) => new Express(baseUrl);
express.json = createJsonMiddleware;
express.static = createStaticMiddleware;
express.log = createLogMiddleware;

export default express;
