import assert from 'node:assert/strict';
import test from 'node:test';
import { extractJsonObject, formatImageDataUrl, normalizeCopy, parseCopyCompletion } from './ai.js';
import { buildCopyMessages, buildPosterPrompt } from './prompts.js';

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
