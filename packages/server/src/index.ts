import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { getAllTodos, addTodo, toggleTodo, deleteTodo } from './todos.js';
import * as Sentry from '@sentry/node';
import './instrument.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Sentry est initialisé via ./instrument.js
app.get('/api/todos', async (req, res) => {
  const todos = await getAllTodos();
  res.json(todos);
});

app.post('/api/todos', async (req, res) => {
  const { text } = req.body;
  const todo = await addTodo(text);
  res.json(todo);
});

app.patch('/api/todos/:id', async (req, res) => {
  const todo = await toggleTodo(req.params.id);
  res.json(todo);
});

app.delete('/api/todos/:id', async (req, res) => {
  const result = await deleteTodo(req.params.id);
  res.json(result);
});

// Route de test: envoi manuel d'un événement à Sentry
app.get('/sentry-test', async (req: Request, res: Response) => {
  const eventId = Sentry.captureMessage('Sentry manual test', 'error');
  // Force l'envoi avant de répondre (utile en dev/watch)
  await Sentry.flush(2000);
  res.json({ sentryEventId: eventId });
});

app.get("/debug-sentry", function mainHandler(req: Request, res: Response) {
  throw new Error('My first Sentry error!');
});

// Sentry: error handler doit être installé APRÈS toutes les routes et AVANT les handlers custom
Sentry.setupExpressErrorHandler(app);

app.use(function onError(err: Error, req: Request, res: Response, next: NextFunction) {
  // Capture manuelle au cas où
  Sentry.captureException(err);
  res.statusCode = 500;
  res.end((res as any).sentry + "\n");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;