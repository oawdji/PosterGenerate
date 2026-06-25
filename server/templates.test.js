import assert from 'node:assert/strict';
import test from 'node:test';
import { getTemplateGuide, normalizeTemplate, TEMPLATE_KEYS } from './templates.js';

test('normalizeTemplate keeps supported template keys', () => {
  assert.equal(normalizeTemplate('event'), 'event');
  assert.equal(normalizeTemplate('brand'), 'brand');
  assert.equal(normalizeTemplate('holiday'), 'holiday');
});

test('normalizeTemplate defaults unsupported input to commercial', () => {
  assert.equal(normalizeTemplate(undefined), 'commercial');
  assert.equal(normalizeTemplate(''), 'commercial');
  assert.equal(normalizeTemplate('minimalist'), 'commercial');
});

test('getTemplateGuide returns a stable guide for every template key', () => {
  for (const key of TEMPLATE_KEYS) {
    const guide = getTemplateGuide(key);
    assert.equal(typeof guide.label, 'string');
    assert.equal(typeof guide.prompt, 'string');
    assert.ok(guide.prompt.length > 20);
  }
});
