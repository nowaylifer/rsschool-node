import fs from 'node:fs/promises';
import { EOL } from 'node:os';

export async function asyncIterableToArray(asyncIterable) {
  const result = [];

  for await (const value of asyncIterable) {
    result.push(value);
  }

  return result;
}

export async function mkdirForce(path) {
  try {
    return await fs.mkdir(path, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

export function bindMethods() {
  Object.getOwnPropertyNames(Object.getPrototypeOf(this)).map((key) => {
    if (this[key] instanceof Function && key !== 'constructor') {
      this[key] = this[key].bind(this);
    }
  });
}

export function round(value, precision) {
  const multiplier = Math.pow(10, precision || 0);
  return Math.round(value * multiplier) / multiplier;
}

export function printExitMsg(username) {
  console.log(`Thank you for using File Manager, ${username}, goodbye!`);
}

export function printWelcomeMsg(username) {
  console.log(`Welcome to the File Manager, ${username}!`);
}

export function printEOL() {
  process.stdout.write(EOL);
}

export function parseStringToArgv(value) {
  const regexp = /([^\s'"]([^\s'"]*(['"])([^\3]*?)\3)+[^\s'"]*)|[^\s'"]+|(['"])([^\5]*?)\5/gi;

  return [...value.matchAll(regexp)].map((match) =>
    [match[1], match[6], match[0]].find((v) => typeof v === 'string')
  );
}
