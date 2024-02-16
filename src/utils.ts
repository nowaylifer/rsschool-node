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
