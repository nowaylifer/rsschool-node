import { UserDraft, HttpMethod } from '../types';
import app from '../app';
import db from '../db';

const port = 8050;
const baseUrl = `http://localhost:${port}/`;

beforeAll(() => {
  app.listen(port);
});

beforeEach(() => {
  db.clear();
});

afterAll(() => {
  app.close();
});

test('GET api/users', async () => {
  const response = await fetch(baseUrl + 'api/users');
  const body = await response.json();
  expect(response.status).toBe(200);
  expect(body).toEqual([]);
});

test('POST api/users', async () => {
  const user = { username: 'new-user', age: 23, hobbies: ['anything'] };
  const response = await createUser(user);
  const body = await response.json();

  expect(response.status).toBe(201);
  expect(body).toEqual(expect.objectContaining({ id: expect.any(String), ...user }));
});

test('GET api/users/:id', async () => {
  const newUser = await createUser().then((resp) => resp.json());
  const response = await fetch(baseUrl + `api/users/${newUser.id}`);
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body).toEqual(newUser);
});

test('PUT api/users/:id', async () => {
  const user = await createUser().then((resp) => resp.json());

  const updates = { ...user, username: 'updated-name', age: 40 };
  const response = await fetchJSON(baseUrl + `api/users/${user.id}`, 'PUT', updates);
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body).toEqual(updates);
});

test('DELETE api/users/:id', async () => {
  const user = await createUser().then((resp) => resp.json());
  const deleteResp = await fetch(baseUrl + `api/users/${user.id}`, { method: 'DELETE' });

  expect(deleteResp.status).toBe(204);

  const getResp = await fetch(baseUrl + `api/users/${user.id}`);
  const body = await getResp.json();

  expect(getResp.status).toBe(404);
  expect(body).toEqual({ error: { status: 404, message: 'User not found' } });
});

function createUser(user: UserDraft = { username: 'new-user', age: 23, hobbies: ['anything'] }) {
  return fetchJSON(baseUrl + 'api/users', 'POST', user);
}

function fetchJSON(url: string, method: HttpMethod, body: unknown) {
  return fetch(url, {
    method,
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
