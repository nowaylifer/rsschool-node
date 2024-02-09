import express, { type ClientRequest } from './express';
import { v4 as uuid, validate as validateUuid } from 'uuid';
import { assertIsUserDraft } from './utils';
import type { User } from './types';

const USERS: User[] = [
  { id: uuid(), username: 'nowaylifer', age: 99, hobbies: ['coding'] },
  { id: uuid(), username: 'hefty1337', age: 20, hobbies: ['video games', 'netflix'] },
];

const app = express('api');

app.use(express.json());

interface RequestWithUser extends ClientRequest {
  user: { index: number; value: User };
}

app.use((req: RequestWithUser, res, next) => {
  if (req.path === 'users/:id') {
    const userId = req.params!.id;

    if (!validateUuid(userId)) {
      return res.status(400).error('Invalid user id');
    }

    const userIndex = USERS.findIndex((user) => user.id === userId);

    if (userIndex >= 0) {
      req.user = { index: userIndex, value: USERS[userIndex] };
      next();
    } else {
      res.status(404).error('User not found');
    }

    return;
  }

  next();
});

app.get('users', (_req, res) => {
  res.status(200).send(USERS);
});

app.post('users', (req, res) => {
  try {
    assertIsUserDraft(req.body);
    const user = { id: uuid(), ...req.body };
    USERS.push(user);
    res.status(201).send(user);
  } catch (error) {
    res.status(400).error((error as Error).message);
  }
});

app.get('users/:id', (req: RequestWithUser, res) => {
  res.status(200).send(req.user.value);
});

app.put('users/:id', (req: RequestWithUser, res) => {
  try {
    assertIsUserDraft(req.body);
    const userUpdated = { ...req.body, id: req.user.value.id };
    USERS[req.user.index] = userUpdated;
    res.status(200).send(userUpdated);
  } catch (error) {
    res.status(400).error((error as Error).message);
  }
});

app.delete('users/:id', (req: RequestWithUser, res) => {
  const { index } = req.user;
  USERS.splice(index, 1);
  res.status(204).end();
});

export default app;
