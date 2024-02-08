import express from './express';
import { v4 as uuid, validate as validateUuid } from 'uuid';
import type { User } from './types';

const USERS: User[] = [
  { id: uuid(), username: 'nowaylifer', age: 99, hobbies: ['coding'] },
  { id: uuid(), username: 'hefty1337', age: 20, hobbies: ['video games', 'netflix'] },
];

const app = express('api');

app.get('users', (_req, res) => {
  res.status(200).json(USERS);
});

app.get('users/:id', (req, res) => {
  const userId = req.params!.id;

  if (!validateUuid(userId)) {
    return res.status(400).error('Invalid user id');
  }

  const user = USERS.find((user) => user.id === userId);

  if (user) {
    res.status(200).json(user);
  } else {
    res.status(404).error('User not found');
  }
});

export default app;
