import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock en mémoire du module de stockage pour éviter les accès disque
const memory: { todos: Array<{ id: string; text: string; completed: boolean; createdAt: string }> } = {
  todos: [],
};

vi.mock('./storage.js', () => {
  return {
    readTodos: vi.fn(async () => memory.todos),
    writeTodos: vi.fn(async (todos: any[]) => {
      memory.todos = todos as any;
    }),
  };
});

// Important: importer l'app APRÈS avoir mocké
import app from './index.js';

describe('todos api', () => {
  beforeEach(() => {
    memory.todos = [
      { id: '1', text: 'First', completed: false, createdAt: new Date(0).toISOString() },
    ];
  });

  afterEach(() => {
    memory.todos = [];
    vi.clearAllMocks();
  });

  it('GET /api/todos should return list', async () => {
    const res = await request(app).get('/api/todos');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].text).toBe('First');
  });

  it('POST /api/todos should create a todo', async () => {
    const res = await request(app).post('/api/todos').send({ text: 'New task' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ text: 'New task', completed: false });
    expect(typeof res.body.id).toBe('string');
    expect(typeof res.body.createdAt).toBe('string');

    // Vérifie que le nouvel élément est présent via GET
    const list = await request(app).get('/api/todos');
    expect(list.status).toBe(200);
    expect(list.body.some((t: any) => t.text === 'New task')).toBe(true);
  });
});


