import assert from 'node:assert/strict';
import test from 'node:test';
import { cleanEnvValue, createConfigFromEnv } from './env.js';

test('cleanEnvValue removes straight and smart wrapping quotes', () => {
  assert.equal(cleanEnvValue('"https://api.example.com"'), 'https://api.example.com');
  assert.equal(cleanEnvValue('“https://api.example.com”'), 'https://api.example.com');
  assert.equal(cleanEnvValue("'model-name'"), 'model-name');
  assert.equal(cleanEnvValue(' bare-value '), 'bare-value');
});

test('createConfigFromEnv normalizes text, image, and port values', () => {
  const config = createConfigFromEnv({
    AI_API_KEY: ' text-key ',
    AI_BASE_URL: '“https://text.example.com”',
    AI_MODEL: ' poster-copy-model ',
    AI_IMAGE_API_KEY: ' image-key ',
    AI_IMAGE_BASE_URL: '“https://image.example.com”',
    AI_IMAGE_MODEL: ' poster-image-model ',
    PORT: ' 4010 ',
  });

  assert.deepEqual(config, {
    port: 4010,
    text: {
      apiKey: 'text-key',
      baseUrl: 'https://text.example.com',
      model: 'poster-copy-model',
    },
    image: {
      apiKey: 'image-key',
      baseUrl: 'https://image.example.com',
      model: 'poster-image-model',
    },
  });
});
