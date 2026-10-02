import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';

const app = createApp();

describe('API foundation health endpoint', () => {
  it('returns a liveness response without requiring Firebase or PostgreSQL', async () => {
    const response = await request(app).get('/api/v1/healthz');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('returns a JSON 404 for an unknown versioned API endpoint', async () => {
    const response = await request(app).get('/api/v1/not-a-route');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
