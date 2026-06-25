import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import { createApp } from './app.js';

async function request(app, path, body) {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    return {
      status: response.status,
      body: await response.json(),
    };
  } finally {
    await new Promise((resolve) => {
      server.close(resolve);
    });
  }
}

test('POST /api/copy rejects empty requirements', async () => {
  const app = createApp({
    services: {
      generateCopy: async () => ({ title: 'unused' }),
      generatePoster: async () => 'unused',
    },
  });

  const response = await request(app, '/api/copy', { requirement: '   ' });

  assert.equal(response.status, 400);
  assert.equal(response.body.message, 'Please describe the poster you want to create.');
});

test('POST /api/copy returns normalized template and copy', async () => {
  const app = createApp({
    services: {
      generateCopy: async ({ requirement, template }) => ({
        title: `${requirement}-${template}`,
        subtitle: 'subtitle',
        sellingPoints: ['point'],
        callToAction: 'action',
        visualStyle: 'style',
        imagePrompt: 'prompt',
      }),
      generatePoster: async () => 'unused',
    },
  });

  const response = await request(app, '/api/copy', {
    requirement: '咖啡店促销',
    template: 'event',
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.copy.title, '咖啡店促销-event');
});

test('POST /api/poster rejects empty copy', async () => {
  const app = createApp({
    services: {
      generateCopy: async () => ({ title: 'unused' }),
      generatePoster: async () => 'unused',
    },
  });

  const response = await request(app, '/api/poster', { copy: {} });

  assert.equal(response.status, 400);
  assert.equal(response.body.message, 'Please generate or enter poster copy before creating an image.');
});

test('POST /api/poster returns generated image', async () => {
  const calls = [];
  const app = createApp({
    services: {
      generateCopy: async () => ({ title: 'unused' }),
      generatePoster: async (payload) => {
        calls.push(payload);
        return `data:image/png;base64,${Buffer.from(payload.copy.title).toString('base64')}`;
      },
    },
  });

  const response = await request(app, '/api/poster', {
    template: 'commercial',
    copy: { title: '新品上市' },
    imageOptions: { quality: 'high', aspectRatio: '16:9' },
  });

  assert.equal(response.status, 200);
  assert.match(response.body.image, /^data:image\/png;base64,/);
  assert.deepEqual(calls[0].imageOptions, { quality: 'high', aspectRatio: '16:9' });
});

test('POST /api/poster/edit rejects requests without a selected point and instruction', async () => {
  const app = createApp({
    services: {
      generateCopy: async () => ({ title: 'unused' }),
      generatePoster: async () => 'unused',
      editPoster: async () => 'unused',
    },
  });

  const response = await request(app, '/api/poster/edit', {
    instruction: '   ',
    selection: { x: 0.5 },
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.message, 'Please click a poster location and describe the local edit.');
});

test('POST /api/poster/edit returns the edited poster image', async () => {
  const calls = [];
  const app = createApp({
    services: {
      generateCopy: async () => ({ title: 'unused' }),
      generatePoster: async () => 'unused',
      editPoster: async (payload) => {
        calls.push(payload);
        return 'data:image/png;base64,ZWRpdGVk';
      },
    },
  });

  const response = await request(app, '/api/poster/edit', {
    template: 'event',
    copy: { title: '新品上市' },
    imageOptions: { quality: 'medium', aspectRatio: '3:4' },
    instruction: '把这里改成红色按钮',
    selection: { x: 0.25, y: 0.75 },
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.image, 'data:image/png;base64,ZWRpdGVk');
  assert.deepEqual(calls[0], {
    template: 'event',
    copy: {
      title: '新品上市',
      subtitle: '',
      sellingPoints: [],
      callToAction: '',
      visualStyle: '',
      imagePrompt: '',
    },
    instruction: '把这里改成红色按钮',
    imageOptions: { quality: 'medium', aspectRatio: '3:4' },
    selection: { x: 0.25, y: 0.75 },
  });
});
