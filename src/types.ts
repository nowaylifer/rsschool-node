export type JSONValue = string | number | boolean | { [x: string]: JSONValue } | JSONValue[];

export type HttpMethod = (typeof HttpMethod)[keyof typeof HttpMethod];
export const HttpMethod = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
} as const;

export type User = {
  id: string;
  username: string;
  age: number;
  hobbies: string[];
};

export type UserDraft = Omit<User, 'id'>;
