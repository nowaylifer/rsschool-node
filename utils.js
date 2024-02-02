import fs from 'node:fs/promises';

export function printError(error) {
  const redCode = '\x1b[31m%s';
  const resetCode = '\x1b[0m';

  if (error?.message) {
    const msg = error.message.replace(`${error.code}: `, '');
    console.error(redCode, 'Operation failed: ' + resetCode + msg);
  } else {
    console.error(error);
  }
}

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
