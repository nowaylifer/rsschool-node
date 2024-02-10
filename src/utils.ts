import type { IncomingMessage } from 'node:http';
import cluster from 'node:cluster';
import { UserDraft } from './types';

export function assertIsUserDraft(value: unknown): asserts value is UserDraft {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Request body is not of type "object"');
  }

  if (!('username' in value) || typeof value.username !== 'string') {
    throwFieldError('username');
  }

  if (!('age' in value) || typeof value.age !== 'number') {
    throwFieldError('age');
  }

  if (
    !('hobbies' in value) ||
    !Array.isArray(value.hobbies) ||
    value.hobbies.some((v) => typeof v !== 'string')
  ) {
    throwFieldError('hobbies');
  }
}

function throwFieldError(field: string) {
  throw new Error(`Field "${field}" is missing or has a wrong type`);
}

export function logRequest(req: IncomingMessage) {
  if (cluster.isWorker) {
    console.log(`Worker ${cluster.worker!.id} is handling request ${req.method} ${req.url}`);
  } else {
    console.log(`${req.method} ${req.url}`);
  }
}
