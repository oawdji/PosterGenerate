import assert from 'node:assert/strict';
import test from 'node:test';
import {
  extractJsonObject,
  formatImageDataUrl,
  generateEditedPoster,
  normalizeCopy,
  parseCopyCompletion,
  requestJson,
} from './ai.js';
import { buildCopyMessages, buildPosterEditPrompt, buildPosterPrompt } from './prompts.js';

test('extractJsonObject reads the first JSON object from model text', () => {
  const raw = 'Here is the copy: {"title":"新品上市","sellingPoints":["限时优惠"]} Thank you.';
  assert.equal(extractJsonObject(raw), '{"title":"新品上市","sellingPoints":["限时优惠"]}');
});

test('normalizeCopy produces the stable poster copy shape', () => {
  assert.deepEqual(
    normalizeCopy({
      title: '新品上市',
      subtitle: '周末限定',
      sellingPoints: ['手作甜点', 123, '精品咖啡'],
      callToAction: '立即到店',
      visualStyle: 'warm premium poster',
      imagePrompt: 'A complete coffee poster',
    }),
    {
      title: '新品上市',
      subtitle: '周末限定',
      sellingPoints: ['手作甜点', '精品咖啡'],
      callToAction: '立即到店',
      visualStyle: 'warm premium poster',
      imagePrompt: 'A complete coffee poster',
    },
  );
});

test('parseCopyCompletion parses OpenAI-compatible chat completion content', () => {
  const completion = {
    choices: [
      {
        message: {
          content:
            '{"title":"新品上市","subtitle":"周末限定","sellingPoints":["手作甜点"],"callToAction":"立即到店","visualStyle":"warm","imagePrompt":"complete poster"}',
        },
      },
    ],
  };

  assert.equal(parseCopyCompletion(completion).title, '新品上市');
  assert.deepEqual(parseCopyCompletion(completion).sellingPoints, ['手作甜点']);
});

test('formatImageDataUrl formats b64_json as a png data URL', () => {
  assert.equal(formatImageDataUrl({ data: [{ b64_json: 'aW1hZ2U=' }] }), 'data:image/png;base64,aW1hZ2U=');
});

test('requestJson sends AI requests with an abort signal', async () => {
  const originalFetch = globalThis.fetch;
  let signal;
  globalThis.fetch = async (_url, options) => {
    signal = options.signal;
    return new Response('{}', {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  try {
    await requestJson({
      baseUrl: 'https://api.example.com',
      apiKey: 'key',
      path: '/v1/test',
      body: { ok: true },
    });

    assert.equal(typeof signal?.aborted, 'boolean');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('buildCopyMessages includes requirement and template guidance', () => {
  const messages = buildCopyMessages({
    requirement: '咖啡店周末促销',
    template: 'commercial',
  });

  assert.equal(messages[0].role, 'system');
  assert.equal(messages[1].role, 'user');
  assert.match(messages[1].content, /咖啡店周末促销/);
  assert.match(messages[1].content, /commercial promotion poster/);
});

test('buildPosterPrompt includes edited copy and asks for a complete poster', () => {
  const prompt = buildPosterPrompt({
    template: 'commercial',
    copy: {
      title: '新品上市',
      subtitle: '周末限定',
      sellingPoints: ['手作甜点', '精品咖啡'],
      callToAction: '立即到店',
      visualStyle: 'warm premium poster',
      imagePrompt: 'A complete coffee poster',
    },
  });

  assert.match(prompt, /complete finished poster image/);
  assert.match(prompt, /新品上市/);
  assert.match(prompt, /手作甜点/);
  assert.match(prompt, /commercial promotion poster/);
});

test('buildPosterEditPrompt includes the selected point and local edit instruction', () => {
  const prompt = buildPosterEditPrompt({
    template: 'commercial',
    instruction: '把这里改成红色按钮',
    selection: { x: 0.25, y: 0.75 },
    copy: {
      title: '新品上市',
      sellingPoints: ['精品咖啡'],
    },
  });

  assert.match(prompt, /Selected point: x 25%, y 75%/);
  assert.match(prompt, /把这里改成红色按钮/);
  assert.match(prompt, /Preserve the rest of the poster/);
  assert.match(prompt, /新品上市/);
});

test('generateEditedPoster uses the image generation endpoint with the local edit prompt', async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return new Response(JSON.stringify({ data: [{ b64_json: 'ZWRpdGVk' }] }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  try {
    const image = await generateEditedPoster(
      {
        image: {
          baseUrl: 'https://image.example.com',
          apiKey: 'image-key',
          model: 'poster-model',
        },
      },
      {
        image: 'data:image/png;base64,b3JpZ2luYWw=',
        template: 'commercial',
        selection: { x: 0.25, y: 0.75 },
        instruction: '把这里改成红色按钮',
        copy: { title: '新品上市' },
      },
    );

    assert.equal(image, 'data:image/png;base64,ZWRpdGVk');
    assert.equal(requests[0].url, 'https://image.example.com/v1/images/generations');
    assert.equal(requests[0].options.headers['content-type'], 'application/json');
    const body = JSON.parse(requests[0].options.body);
    assert.equal(body.model, 'poster-model');
    assert.match(body.prompt, /Selected point: x 25%, y 75%/);
    assert.match(body.prompt, /把这里改成红色按钮/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
