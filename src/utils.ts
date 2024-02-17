import { WebSocket } from 'ws';
import type { Player } from './game';
import type { WS } from './game-server';
import type { AttackStatus, Position, RegisterResponse, ServerMessage } from './types';

export const retry = <This, Args extends any[], Return>(
  fn: (this: This, ...args: Args) => Return extends Promise<any> ? Awaited<Return> : Return,
  times: number,
  delay: number,
) => {
  return async function _retry(this: This, ...args: Args): Promise<Return> {
    try {
      return await fn.apply(this, args);
    } catch (error) {
      if (--times > 0) {
        await new Promise((res) => setTimeout(res, delay));
        return await _retry.apply(this, args);
      }
      throw error;
    }
  };
};

export const randomArrayElement = <T>(array: T[]) =>
  array[Math.floor(Math.random() * array.length)];

export const uuid = () => crypto.randomUUID();

export const isPosition = (value: object): value is Position => {
  return 'x' in value && 'y' in value && typeof value.x === 'number' && typeof value.y === 'number';
};

export const createAttackResponse =
  (playerId: Player['id']) =>
  (status: AttackStatus, position: Position): ServerMessage<'attack'> => {
    return {
      type: 'attack',
      data: {
        currentPlayer: playerId,
        status,
        position,
      },
    };
  };

export const createRegisterResponse = (msg: RegisterResponse): ServerMessage<'reg'> => ({
  type: 'reg',
  data: msg,
});

export const createMockWS = (): WS => {
  const socket = new WebSocket('ws://localhost:3000') as WS;
  socket.json = () => Promise.resolve();
  socket.sendPromises = () => Promise.resolve();
  return socket;
};
