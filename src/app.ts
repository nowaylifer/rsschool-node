import express, { type ClientRequest } from './express';
import { v4 as uuid, validate as validateUuid } from 'uuid';
import { assertIsUserDraft } from './utils';
import type { User } from './types';
import db from './db';

const app = express('api');

app.use(express.json());

interface RequestWithUser extends ClientRequest {
  user: User;
}

app.use((req: RequestWithUser, res, next) => {
  if (req.path === 'users/:id') {
    const userId = req.params!.id;

    if (!validateUuid(userId)) {
      return res.status(400).error('Invalid user id');
    }

    const user = db.get(userId);

    if (user) {
      req.user = user;
      next();
    } else {
      res.status(404).error('User not found');
    }

    return;
  }

  next();
});

app.get('users', (_req, res) => {
  res.status(200).send(db.values());
});

app.post('users', (req, res) => {
  try {
    assertIsUserDraft(req.body);
    const user = { ...req.body, id: uuid() };
    db.set(user.id, user);
    res.status(201).send(user);
  } catch (error) {
    res.status(400).error((error as Error).message);
  }
});

app.get('users/:id', (req: RequestWithUser, res) => {
  res.status(200).send(req.user);
});

app.put('users/:id', (req: RequestWithUser, res) => {
  try {
    assertIsUserDraft(req.body);
    const userUpdated = { ...req.body, id: req.user.id };
    db.set(req.user.id, userUpdated);
    res.status(200).send(userUpdated);
  } catch (error) {
    res.status(400).error((error as Error).message);
  }
});

app.delete('users/:id', (req: RequestWithUser, res) => {
  db.delete(req.user.id);
  res.status(204).end();
});

export default app;
