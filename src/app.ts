import { v4 as uuid, validate as validateUuid } from 'uuid';
import { RequestWithUser, UserDraft } from './types';
import { createUserDTO, createUserDraftDTO } from './utils';
import express from './express';
import db from './db';

const app = express('api');

app.use(express.exceptions());
app.use(express.json());

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
  let userDraft: UserDraft;

  try {
    userDraft = createUserDraftDTO(req.body);
  } catch (error) {
    return res.status(400).error((error as Error).message);
  }

  const user = createUserDTO(uuid(), userDraft);
  db.set(user.id, user);
  res.status(201).send(user);
});

app.get('users/:id', (req: RequestWithUser, res) => {
  res.status(200).send(req.user);
});

app.put('users/:id', (req: RequestWithUser, res) => {
  let userDraft: UserDraft;

  try {
    userDraft = createUserDraftDTO(req.body);
  } catch (error) {
    return res.status(400).error((error as Error).message);
  }

  const userUpdated = createUserDTO(req.user.id, userDraft);
  db.set(req.user.id, userUpdated);
  res.status(200).send(userUpdated);
});

app.delete('users/:id', (req: RequestWithUser, res) => {
  db.delete(req.user.id);
  res.status(204).end();
});

app.get('error', () => {
  throw new Error();
});

export default app;
