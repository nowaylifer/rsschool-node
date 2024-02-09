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
  user: User;
}

app.use((req, res, next) => {
  if (req.path === 'users/:id') {
    const userId = req.params!.id;

    if (!validateUuid(userId)) {
      return res.status(400).error('Invalid user id');
    }

    const user = USERS.find((user) => user.id === userId);

    if (user) {
      Object.assign(req, { user });
      next();
    } else {
      res.status(404).error('User not found');
    }

    return;
  }

  next();
});

app.get('users', (_req, res) => {
  res.status(200).json(USERS);
});

app.get('users/:id', (req, res) => {});

app.post('users', (req, res) => {
  try {
    assertIsUserDraft(req.body);
    const user = { id: uuid(), ...req.body };
    USERS.push(user);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).error((error as Error).message);
  }
});

app.put('users/:id', (req, res) => {});

export default app;
