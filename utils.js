export function printError(error) {
  const redCode = '\x1b[31m%s\x1b[0m';

  if (error?.message) {
    console.error(redCode, error.message);
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
