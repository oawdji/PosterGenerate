# AI Poster Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a minimal React + Vite and Node.js app that generates AI poster copy, lets the user edit it, and then directly generates a complete poster image through the configured image API.

**Architecture:** Use one npm project with a Vite React frontend in `src/` and an Express backend in `server/`. Backend modules isolate environment loading, template guidance, prompt construction, AI response parsing, and route wiring so they can be tested without network calls. The frontend owns the workflow state and calls only `/api/copy` and `/api/poster`.

**Tech Stack:** React, Vite, Node.js ESM, Express, dotenv, cors, Vitest, Testing Library, Node's built-in test runner, npm scripts.

---

## File Structure

- Create `package.json`: project scripts, runtime dependencies, dev dependencies.
- Create `.gitignore`: excludes dependencies, build output, local env files, and macOS metadata.
- Create `index.html`: Vite HTML entry.
- Create `vite.config.js`: React plugin, test environment, and `/api` proxy for local development.
- Create `server/env.js`: normalize `.env` values and load backend configuration.
- Create `server/templates.js`: poster template definitions and template normalization.
- Create `server/prompts.js`: text-model and image-model prompt builders.
- Create `server/ai.js`: AI HTTP client helpers, JSON extraction, copy normalization, and base64 image formatting.
- Create `server/app.js`: Express app factory with injectable AI services.
- Create `server/index.js`: production/dev backend entrypoint.
- Create `server/env.test.js`: tests for environment cleaning and config loading.
- Create `server/templates.test.js`: tests for template normalization and template guidance.
- Create `server/ai.test.js`: tests for JSON extraction, copy parsing, and image formatting.
- Create `server/app.test.js`: route validation and success-path tests using injected services.
- Create `src/main.jsx`: React entrypoint.
- Create `src/App.jsx`: main workflow and component composition.
- Create `src/api.js`: frontend fetch helpers.
- Create `src/App.test.jsx`: user workflow tests.
- Create `src/setupTests.js`: Testing Library matcher setup.
- Create `src/styles.css`: application layout and states.

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `index.html`
- Create: `vite.config.js`
- Create: `src/setupTests.js`

- [ ] **Step 1: Create the npm manifest**

Write `package.json`:

```json
{
  "name": "ai-poster-tool",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:client": "vite --host 127.0.0.1",
    "dev:server": "node --watch server/index.js",
    "build": "vite build",
    "preview": "vite preview --host 127.0.0.1",
    "test": "npm run test:server && npm run test:client",
    "test:server": "node --test \"server/**/*.test.js\"",
    "test:client": "vitest run"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^4.4.1",
    "concurrently": "^9.1.2",
    "cors": "^2.8.5",
    "dotenv": "^16.5.0",
    "express": "^4.21.2",
    "lucide-react": "^0.468.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "vite": "^6.3.5"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    "jsdom": "^26.1.0",
    "vitest": "^3.2.3"
  }
}
```

- [ ] **Step 2: Create project ignores**

Write `.gitignore`:

```gitignore
node_modules/
dist/
.env
.env.*
.DS_Store
coverage/
```

- [ ] **Step 3: Create the Vite HTML entry**

Write `index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI Poster Tool</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Create Vite config**

Write `vite.config.js`:

```js
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:3001',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    globals: true,
  },
});
```

- [ ] **Step 5: Create test setup**

Write `src/setupTests.js`:

```js
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 6: Install dependencies**

Run: `npm install`

Expected: `package-lock.json` is created and npm exits with code `0`.

- [ ] **Step 7: Run the empty test suite**

Run: `npm test`

Expected: server tests report no matching test files or no tests before later tasks add tests; client test command may report no test files. Continue after confirming npm and Vite tooling are installed.

- [ ] **Step 8: Commit scaffold**

```bash
git add package.json package-lock.json .gitignore index.html vite.config.js src/setupTests.js
git commit -m "chore: scaffold ai poster app"
```

## Task 2: Backend Environment and Template Utilities

**Files:**
- Create: `server/env.test.js`
- Create: `server/templates.test.js`
- Create: `server/env.js`
- Create: `server/templates.js`

- [ ] **Step 1: Write failing env tests**

Write `server/env.test.js`:

```js
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
```

- [ ] **Step 2: Verify env tests fail**

Run: `npm run test:server -- server/env.test.js`

Expected: FAIL with an import error for `./env.js`.

- [ ] **Step 3: Implement env utilities**

Write `server/env.js`:

```js
import dotenv from 'dotenv';

export function cleanEnvValue(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim().replace(/^[ "'“”‘’]+|[ "'“”‘’]+$/g, '');
}

export function createConfigFromEnv(source) {
  const portValue = Number.parseInt(cleanEnvValue(source.PORT), 10);

  return {
    port: Number.isFinite(portValue) ? portValue : 3001,
    text: {
      apiKey: cleanEnvValue(source.AI_API_KEY),
      baseUrl: cleanEnvValue(source.AI_BASE_URL),
      model: cleanEnvValue(source.AI_MODEL),
    },
    image: {
      apiKey: cleanEnvValue(source.AI_IMAGE_API_KEY),
      baseUrl: cleanEnvValue(source.AI_IMAGE_BASE_URL),
      model: cleanEnvValue(source.AI_IMAGE_MODEL),
    },
  };
}

export function loadConfig() {
  dotenv.config();
  return createConfigFromEnv(process.env);
}
```

- [ ] **Step 4: Verify env tests pass**

Run: `npm run test:server -- server/env.test.js`

Expected: PASS for both env tests.

- [ ] **Step 5: Write failing template tests**

Write `server/templates.test.js`:

```js
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
```

- [ ] **Step 6: Verify template tests fail**

Run: `npm run test:server -- server/templates.test.js`

Expected: FAIL with an import error for `./templates.js`.

- [ ] **Step 7: Implement template utilities**

Write `server/templates.js`:

```js
export const TEMPLATES = {
  commercial: {
    label: '商业促销',
    prompt: 'commercial promotion poster, clear offer hierarchy, strong product focus, polished marketing composition',
  },
  event: {
    label: '活动邀请',
    prompt: 'event invitation poster, inviting atmosphere, clear time and participation feeling, energetic composition',
  },
  brand: {
    label: '品牌宣传',
    prompt: 'brand campaign poster, premium identity, memorable visual symbol, refined and trustworthy composition',
  },
  holiday: {
    label: '节日营销',
    prompt: 'holiday marketing poster, festive mood, seasonal details, warm commercial appeal, celebratory composition',
  },
};

export const TEMPLATE_KEYS = Object.keys(TEMPLATES);

export function normalizeTemplate(template) {
  return TEMPLATE_KEYS.includes(template) ? template : 'commercial';
}

export function getTemplateGuide(template) {
  return TEMPLATES[normalizeTemplate(template)];
}
```

- [ ] **Step 8: Verify backend utility tests pass**

Run: `npm run test:server -- server/env.test.js server/templates.test.js`

Expected: PASS for env and template tests.

- [ ] **Step 9: Commit backend utilities**

```bash
git add server/env.test.js server/templates.test.js server/env.js server/templates.js
git commit -m "feat: add backend config and template utilities"
```

## Task 3: AI Parsing and Prompt Builders

**Files:**
- Create: `server/ai.test.js`
- Create: `server/prompts.js`
- Create: `server/ai.js`

- [ ] **Step 1: Write failing AI helper tests**

Write `server/ai.test.js`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  extractJsonObject,
  formatImageDataUrl,
  normalizeCopy,
  parseCopyCompletion,
} from './ai.js';
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
          content: '{"title":"新品上市","subtitle":"周末限定","sellingPoints":["手作甜点"],"callToAction":"立即到店","visualStyle":"warm","imagePrompt":"complete poster"}',
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
```

- [ ] **Step 2: Verify AI helper tests fail**

Run: `npm run test:server -- server/ai.test.js`

Expected: FAIL with import errors for `./ai.js` and `./prompts.js`.

- [ ] **Step 3: Implement prompt builders**

Write `server/prompts.js`:

```js
import { getTemplateGuide, normalizeTemplate } from './templates.js';

export function buildCopyMessages({ requirement, template }) {
  const templateGuide = getTemplateGuide(template);

  return [
    {
      role: 'system',
      content:
        'You are a senior Chinese advertising copywriter and poster art director. Return strict JSON only. The JSON object must contain title, subtitle, sellingPoints, callToAction, visualStyle, and imagePrompt.',
    },
    {
      role: 'user',
      content: [
        `User requirement: ${requirement}`,
        `Template: ${templateGuide.label}`,
        `Template visual direction: ${templateGuide.prompt}`,
        'Create concise Chinese poster copy. sellingPoints must be an array of 3 short strings.',
        'imagePrompt must be an English prompt for generating a complete poster image with the copy visibly included in the design.',
      ].join('\n'),
    },
  ];
}

export function buildPosterPrompt({ copy, template }) {
  const safeCopy = copy || {};
  const templateGuide = getTemplateGuide(normalizeTemplate(template));
  const sellingPoints = Array.isArray(safeCopy.sellingPoints)
    ? safeCopy.sellingPoints.filter(Boolean).join(' / ')
    : '';

  return [
    'Generate a complete finished poster image, not a background and not a mockup.',
    `Poster type: ${templateGuide.label}.`,
    `Visual direction: ${templateGuide.prompt}.`,
    safeCopy.visualStyle ? `Style: ${safeCopy.visualStyle}.` : '',
    safeCopy.imagePrompt ? `Art direction: ${safeCopy.imagePrompt}.` : '',
    'Use the following Chinese text as visible poster typography:',
    safeCopy.title ? `Main title: ${safeCopy.title}` : '',
    safeCopy.subtitle ? `Subtitle: ${safeCopy.subtitle}` : '',
    sellingPoints ? `Selling points: ${sellingPoints}` : '',
    safeCopy.callToAction ? `Call to action: ${safeCopy.callToAction}` : '',
    'Design requirements: polished commercial poster, strong layout hierarchy, readable typography, high-resolution square composition.',
  ]
    .filter(Boolean)
    .join('\n');
}
```

- [ ] **Step 4: Implement AI helpers and service calls**

Write `server/ai.js`:

```js
import { buildCopyMessages, buildPosterPrompt } from './prompts.js';

function joinUrl(baseUrl, path) {
  return `${String(baseUrl).replace(/\/+$/, '')}${path}`;
}

export function extractJsonObject(text) {
  const value = String(text || '');
  const start = value.indexOf('{');
  const end = value.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON object found in AI response');
  }

  return value.slice(start, end + 1);
}

export function normalizeCopy(input) {
  const source = input && typeof input === 'object' ? input : {};
  const sellingPoints = Array.isArray(source.sellingPoints)
    ? source.sellingPoints.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim())
    : [];

  return {
    title: typeof source.title === 'string' ? source.title.trim() : '',
    subtitle: typeof source.subtitle === 'string' ? source.subtitle.trim() : '',
    sellingPoints,
    callToAction: typeof source.callToAction === 'string' ? source.callToAction.trim() : '',
    visualStyle: typeof source.visualStyle === 'string' ? source.visualStyle.trim() : '',
    imagePrompt: typeof source.imagePrompt === 'string' ? source.imagePrompt.trim() : '',
  };
}

export function parseCopyCompletion(completion) {
  const content = completion?.choices?.[0]?.message?.content;
  const parsed = JSON.parse(extractJsonObject(content));
  return normalizeCopy(parsed);
}

export function formatImageDataUrl(response) {
  const base64 = response?.data?.[0]?.b64_json;
  if (!base64) {
    throw new Error('Image response did not include b64_json');
  }
  return `data:image/png;base64,${base64}`;
}

export async function requestJson({ baseUrl, apiKey, path, body }) {
  const response = await fetch(joinUrl(baseUrl, path), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const message = data?.error?.message || `AI request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export async function generateCopy(config, payload) {
  const completion = await requestJson({
    baseUrl: config.text.baseUrl,
    apiKey: config.text.apiKey,
    path: '/v1/chat/completions',
    body: {
      model: config.text.model,
      messages: buildCopyMessages(payload),
      temperature: 0.7,
      response_format: { type: 'json_object' },
    },
  });

  return parseCopyCompletion(completion);
}

export async function generatePoster(config, payload) {
  const imageResponse = await requestJson({
    baseUrl: config.image.baseUrl,
    apiKey: config.image.apiKey,
    path: '/v1/images/generations',
    body: {
      model: config.image.model,
      prompt: buildPosterPrompt(payload),
      size: '1024x1024',
      n: 1,
    },
  });

  return formatImageDataUrl(imageResponse);
}
```

- [ ] **Step 5: Verify AI helper tests pass**

Run: `npm run test:server -- server/ai.test.js`

Expected: PASS for AI parsing and prompt builder tests.

- [ ] **Step 6: Commit AI helpers**

```bash
git add server/ai.test.js server/prompts.js server/ai.js
git commit -m "feat: add ai prompt and parsing helpers"
```

## Task 4: Express API Routes

**Files:**
- Create: `server/app.test.js`
- Create: `server/app.js`
- Create: `server/index.js`

- [ ] **Step 1: Write failing route tests**

Write `server/app.test.js`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
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
    await new Promise((resolve) => server.close(resolve));
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
  const app = createApp({
    services: {
      generateCopy: async () => ({ title: 'unused' }),
      generatePoster: async ({ copy }) => `data:image/png;base64,${Buffer.from(copy.title).toString('base64')}`,
    },
  });

  const response = await request(app, '/api/poster', {
    template: 'commercial',
    copy: { title: '新品上市' },
  });

  assert.equal(response.status, 200);
  assert.match(response.body.image, /^data:image\/png;base64,/);
});
```

- [ ] **Step 2: Verify route tests fail**

Run: `npm run test:server -- server/app.test.js`

Expected: FAIL with an import error for `./app.js`.

- [ ] **Step 3: Implement Express app factory**

Write `server/app.js`:

```js
import cors from 'cors';
import express from 'express';
import { normalizeCopy } from './ai.js';
import { normalizeTemplate } from './templates.js';

function hasMeaningfulCopy(copy) {
  const normalized = normalizeCopy(copy);
  return Boolean(
    normalized.title ||
      normalized.subtitle ||
      normalized.callToAction ||
      normalized.visualStyle ||
      normalized.imagePrompt ||
      normalized.sellingPoints.length,
  );
}

export function createApp({ services }) {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_request, response) => {
    response.json({ ok: true });
  });

  app.post('/api/copy', async (request, response) => {
    const requirement = typeof request.body?.requirement === 'string' ? request.body.requirement.trim() : '';
    const template = normalizeTemplate(request.body?.template);

    if (!requirement) {
      response.status(400).json({ message: 'Please describe the poster you want to create.' });
      return;
    }

    try {
      const copy = await services.generateCopy({ requirement, template });
      response.json({ copy });
    } catch (error) {
      console.error('Copy generation failed:', error);
      response.status(502).json({ message: 'Copy generation failed. Please try again.' });
    }
  });

  app.post('/api/poster', async (request, response) => {
    const copy = normalizeCopy(request.body?.copy);
    const template = normalizeTemplate(request.body?.template);

    if (!hasMeaningfulCopy(copy)) {
      response.status(400).json({ message: 'Please generate or enter poster copy before creating an image.' });
      return;
    }

    try {
      const image = await services.generatePoster({ copy, template });
      response.json({ image });
    } catch (error) {
      console.error('Poster generation failed:', error);
      response.status(502).json({ message: 'Poster generation failed. Please adjust the description and try again.' });
    }
  });

  return app;
}
```

- [ ] **Step 4: Implement server entrypoint**

Write `server/index.js`:

```js
import { generateCopy, generatePoster } from './ai.js';
import { createApp } from './app.js';
import { loadConfig } from './env.js';

const config = loadConfig();

const app = createApp({
  services: {
    generateCopy: (payload) => generateCopy(config, payload),
    generatePoster: (payload) => generatePoster(config, payload),
  },
});

app.listen(config.port, '127.0.0.1', () => {
  console.log(`AI poster API listening on http://127.0.0.1:${config.port}`);
});
```

- [ ] **Step 5: Verify route tests pass**

Run: `npm run test:server -- server/app.test.js`

Expected: PASS for route validation and success-path tests.

- [ ] **Step 6: Run all server tests**

Run: `npm run test:server`

Expected: PASS for env, template, AI helper, and route tests.

- [ ] **Step 7: Commit Express API**

```bash
git add server/app.test.js server/app.js server/index.js
git commit -m "feat: add poster api routes"
```

## Task 5: React Workflow UI

**Files:**
- Create: `src/App.test.jsx`
- Create: `src/api.js`
- Create: `src/App.jsx`
- Create: `src/main.jsx`
- Create: `src/styles.css`

- [ ] **Step 1: Write failing frontend workflow tests**

Write `src/App.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PosterTool } from './App.jsx';

const copy = {
  title: '周末新品上市',
  subtitle: '咖啡与甜点限时组合',
  sellingPoints: ['精品咖啡', '手作甜点', '周末限定'],
  callToAction: '立即到店尝鲜',
  visualStyle: 'warm premium coffee poster',
  imagePrompt: 'A complete warm coffee promotion poster',
};

describe('PosterTool', () => {
  it('generates editable copy from a user requirement', async () => {
    const user = userEvent.setup();
    const apiClient = {
      generateCopy: async () => ({ copy }),
      generatePoster: async () => ({ image: 'data:image/png;base64,aW1hZ2U=' }),
    };

    render(<PosterTool apiClient={apiClient} />);

    await user.type(screen.getByLabelText('海报需求'), '咖啡店周末促销');
    await user.selectOptions(screen.getByLabelText('视觉模板'), 'event');
    await user.click(screen.getByRole('button', { name: '生成文案' }));

    expect(await screen.findByDisplayValue('周末新品上市')).toBeInTheDocument();
    expect(screen.getByDisplayValue('立即到店尝鲜')).toBeInTheDocument();
  });

  it('generates and displays the final poster image', async () => {
    const user = userEvent.setup();
    const apiClient = {
      generateCopy: async () => ({ copy }),
      generatePoster: async () => ({ image: 'data:image/png;base64,aW1hZ2U=' }),
    };

    render(<PosterTool apiClient={apiClient} />);

    await user.type(screen.getByLabelText('海报需求'), '咖啡店周末促销');
    await user.click(screen.getByRole('button', { name: '生成文案' }));
    await screen.findByDisplayValue('周末新品上市');
    await user.click(screen.getByRole('button', { name: '生成海报' }));

    const image = await screen.findByAltText('生成的海报');
    expect(image).toHaveAttribute('src', 'data:image/png;base64,aW1hZ2U=');
    expect(screen.getByRole('link', { name: '下载海报' })).toHaveAttribute('href', 'data:image/png;base64,aW1hZ2U=');
  });

  it('keeps the user requirement visible when copy generation fails', async () => {
    const user = userEvent.setup();
    const apiClient = {
      generateCopy: async () => {
        throw new Error('Copy generation failed. Please try again.');
      },
      generatePoster: async () => ({ image: 'unused' }),
    };

    render(<PosterTool apiClient={apiClient} />);

    await user.type(screen.getByLabelText('海报需求'), '咖啡店周末促销');
    await user.click(screen.getByRole('button', { name: '生成文案' }));

    expect(await screen.findByText('Copy generation failed. Please try again.')).toBeInTheDocument();
    expect(screen.getByLabelText('海报需求')).toHaveValue('咖啡店周末促销');
  });
});
```

- [ ] **Step 2: Verify frontend tests fail**

Run: `npm run test:client -- src/App.test.jsx`

Expected: FAIL with an import error for `./App.jsx`.

- [ ] **Step 3: Implement frontend API helpers**

Write `src/api.js`:

```js
async function postJson(path, payload) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || 'Request failed. Please try again.');
  }

  return data;
}

export const apiClient = {
  generateCopy(payload) {
    return postJson('/api/copy', payload);
  },
  generatePoster(payload) {
    return postJson('/api/poster', payload);
  },
};
```

- [ ] **Step 4: Implement React workflow**

Write `src/App.jsx`:

```jsx
import { Download, Image, Loader2, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { apiClient as defaultApiClient } from './api.js';
import './styles.css';

const emptyCopy = {
  title: '',
  subtitle: '',
  sellingPoints: ['', '', ''],
  callToAction: '',
  visualStyle: '',
  imagePrompt: '',
};

const templates = [
  { value: 'commercial', label: '商业促销' },
  { value: 'event', label: '活动邀请' },
  { value: 'brand', label: '品牌宣传' },
  { value: 'holiday', label: '节日营销' },
];

function normalizeCopyFields(copy) {
  return {
    ...emptyCopy,
    ...copy,
    sellingPoints: Array.isArray(copy?.sellingPoints)
      ? [...copy.sellingPoints, '', '', ''].slice(0, 3)
      : emptyCopy.sellingPoints,
  };
}

export function PosterTool({ apiClient = defaultApiClient }) {
  const [requirement, setRequirement] = useState('');
  const [template, setTemplate] = useState('commercial');
  const [copy, setCopy] = useState(emptyCopy);
  const [posterImage, setPosterImage] = useState('');
  const [error, setError] = useState('');
  const [copyLoading, setCopyLoading] = useState(false);
  const [posterLoading, setPosterLoading] = useState(false);

  const hasCopy = useMemo(
    () =>
      Boolean(
        copy.title ||
          copy.subtitle ||
          copy.callToAction ||
          copy.visualStyle ||
          copy.imagePrompt ||
          copy.sellingPoints.some(Boolean),
      ),
    [copy],
  );

  async function handleGenerateCopy() {
    setError('');
    setCopyLoading(true);
    setPosterImage('');

    try {
      const result = await apiClient.generateCopy({ requirement, template });
      setCopy(normalizeCopyFields(result.copy));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setCopyLoading(false);
    }
  }

  async function handleGeneratePoster() {
    setError('');
    setPosterLoading(true);

    try {
      const result = await apiClient.generatePoster({ copy, template });
      setPosterImage(result.image);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPosterLoading(false);
    }
  }

  function updateCopyField(field, value) {
    setCopy((current) => ({ ...current, [field]: value }));
  }

  function updateSellingPoint(index, value) {
    setCopy((current) => ({
      ...current,
      sellingPoints: current.sellingPoints.map((item, itemIndex) => (itemIndex === index ? value : item)),
    }));
  }

  return (
    <main className="app-shell">
      <section className="workspace">
        <div className="control-panel">
          <header className="app-header">
            <div className="mark">
              <Sparkles size={22} aria-hidden="true" />
            </div>
            <div>
              <h1>AI 海报绘制工具</h1>
              <p>描述需求，生成文案，再直接生成完整海报图片。</p>
            </div>
          </header>

          <div className="field-stack">
            <label htmlFor="requirement">海报需求</label>
            <textarea
              id="requirement"
              value={requirement}
              onChange={(event) => setRequirement(event.target.value)}
              rows={5}
              placeholder="例如：给咖啡店做一张周末新品促销海报，风格温暖高级"
            />
          </div>

          <div className="field-stack">
            <label htmlFor="template">视觉模板</label>
            <select id="template" value={template} onChange={(event) => setTemplate(event.target.value)}>
              {templates.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <button className="primary-button" type="button" onClick={handleGenerateCopy} disabled={copyLoading || posterLoading}>
            {copyLoading ? <Loader2 className="spin" size={18} aria-hidden="true" /> : <Sparkles size={18} aria-hidden="true" />}
            生成文案
          </button>

          {error ? <div className="error-message">{error}</div> : null}

          <section className="copy-panel" aria-label="AI 文案">
            <div className="panel-title">AI 文案</div>
            <div className="field-grid">
              <label>
                标题
                <input value={copy.title} onChange={(event) => updateCopyField('title', event.target.value)} />
              </label>
              <label>
                副标题
                <input value={copy.subtitle} onChange={(event) => updateCopyField('subtitle', event.target.value)} />
              </label>
              {copy.sellingPoints.map((point, index) => (
                <label key={index}>
                  卖点 {index + 1}
                  <input value={point} onChange={(event) => updateSellingPoint(index, event.target.value)} />
                </label>
              ))}
              <label>
                行动语
                <input value={copy.callToAction} onChange={(event) => updateCopyField('callToAction', event.target.value)} />
              </label>
              <label>
                视觉风格
                <input value={copy.visualStyle} onChange={(event) => updateCopyField('visualStyle', event.target.value)} />
              </label>
              <label className="wide-field">
                图片提示词
                <textarea
                  value={copy.imagePrompt}
                  rows={4}
                  onChange={(event) => updateCopyField('imagePrompt', event.target.value)}
                />
              </label>
            </div>
          </section>

          <button className="secondary-button" type="button" onClick={handleGeneratePoster} disabled={!hasCopy || copyLoading || posterLoading}>
            {posterLoading ? <Loader2 className="spin" size={18} aria-hidden="true" /> : <Image size={18} aria-hidden="true" />}
            生成海报
          </button>
        </div>

        <section className="poster-panel" aria-label="海报预览">
          {posterImage ? (
            <>
              <img className="poster-image" src={posterImage} alt="生成的海报" />
              <a className="download-button" href={posterImage} download="ai-poster.png">
                <Download size={18} aria-hidden="true" />
                下载海报
              </a>
            </>
          ) : (
            <div className="empty-preview">
              <Image size={42} aria-hidden="true" />
              <p>{posterLoading ? '海报生成中' : '最终海报会显示在这里'}</p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default function App() {
  return <PosterTool />;
}
```

- [ ] **Step 5: Implement React entrypoint**

Write `src/main.jsx`:

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 6: Implement application styles**

Write `src/styles.css`:

```css
:root {
  color: #182028;
  background: #f6f7f4;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

button,
input,
select,
textarea {
  font: inherit;
}

.app-shell {
  min-height: 100vh;
  padding: 24px;
}

.workspace {
  display: grid;
  grid-template-columns: minmax(360px, 520px) minmax(360px, 1fr);
  gap: 24px;
  max-width: 1320px;
  margin: 0 auto;
}

.control-panel,
.poster-panel {
  border: 1px solid #d8ded4;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 18px 48px rgb(31 41 35 / 8%);
}

.control-panel {
  padding: 24px;
}

.app-header {
  display: flex;
  gap: 14px;
  align-items: center;
  margin-bottom: 24px;
}

.mark {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 8px;
  color: #ffffff;
  background: #23685b;
}

h1 {
  margin: 0;
  font-size: 28px;
  line-height: 1.2;
}

p {
  margin: 6px 0 0;
  color: #64716a;
}

.field-stack,
.field-grid label {
  display: grid;
  gap: 8px;
  color: #344139;
  font-size: 14px;
  font-weight: 700;
}

.field-stack {
  margin-bottom: 16px;
}

textarea,
input,
select {
  width: 100%;
  border: 1px solid #cfd7ce;
  border-radius: 8px;
  color: #17211c;
  background: #fbfcfa;
  outline: none;
}

textarea {
  resize: vertical;
  padding: 12px;
  line-height: 1.5;
}

input,
select {
  height: 44px;
  padding: 0 12px;
}

textarea:focus,
input:focus,
select:focus {
  border-color: #23685b;
  box-shadow: 0 0 0 3px rgb(35 104 91 / 14%);
}

.primary-button,
.secondary-button,
.download-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: 46px;
  border: 0;
  border-radius: 8px;
  font-weight: 800;
  text-decoration: none;
  cursor: pointer;
}

.primary-button {
  color: #ffffff;
  background: #23685b;
}

.secondary-button,
.download-button {
  color: #10241f;
  background: #f0c85a;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.error-message {
  margin-top: 14px;
  padding: 12px;
  border: 1px solid #f2beb8;
  border-radius: 8px;
  color: #8f2d24;
  background: #fff3f1;
}

.copy-panel {
  margin: 22px 0;
}

.panel-title {
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 900;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.wide-field {
  grid-column: 1 / -1;
}

.poster-panel {
  position: sticky;
  top: 24px;
  display: grid;
  min-height: calc(100vh - 48px);
  padding: 24px;
  place-items: center;
}

.poster-image {
  width: min(100%, 720px);
  max-height: calc(100vh - 148px);
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 18px 42px rgb(30 36 33 / 18%);
}

.download-button {
  width: min(100%, 320px);
  margin-top: 18px;
}

.empty-preview {
  display: grid;
  place-items: center;
  gap: 8px;
  color: #627268;
  text-align: center;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 920px) {
  .app-shell {
    padding: 14px;
  }

  .workspace {
    grid-template-columns: 1fr;
  }

  .poster-panel {
    position: static;
    min-height: 420px;
  }
}

@media (max-width: 560px) {
  .control-panel,
  .poster-panel {
    padding: 16px;
  }

  .field-grid {
    grid-template-columns: 1fr;
  }

  h1 {
    font-size: 23px;
  }
}
```

- [ ] **Step 7: Verify frontend workflow tests pass**

Run: `npm run test:client -- src/App.test.jsx`

Expected: PASS for the three React workflow tests.

- [ ] **Step 8: Commit React UI**

```bash
git add src/App.test.jsx src/api.js src/App.jsx src/main.jsx src/styles.css
git commit -m "feat: add ai poster workflow ui"
```

## Task 6: Full Verification and Local Run

**Files:**
- Modify only if verification exposes a specific failing behavior in files already created by Tasks 1 through 5.

- [ ] **Step 1: Run all tests**

Run: `npm test`

Expected: server and client tests pass.

- [ ] **Step 2: Build the frontend**

Run: `npm run build`

Expected: Vite production build exits with code `0` and creates `dist/`.

- [ ] **Step 3: Start the local app**

Run: `npm run dev`

Expected:

```text
AI poster API listening on http://127.0.0.1:3001
Local:   http://127.0.0.1:5173/
```

- [ ] **Step 4: Smoke test the configured AI APIs through the app**

Open `http://127.0.0.1:5173/`.

Use this input:

```text
给咖啡店做一张周末新品促销海报，风格温暖高级，突出手作甜点和精品咖啡
```

Expected:

- Clicking `生成文案` fills the copy fields.
- Clicking `生成海报` displays an image in the poster preview.
- Clicking `下载海报` downloads `ai-poster.png`.

- [ ] **Step 5: Check git status**

Run: `git status --short`

Expected: only intentional project files are modified or untracked. `.env` remains untracked and unstaged.

- [ ] **Step 6: Commit final verification adjustments**

If Step 1 or Step 2 required code changes, run:

```bash
git add package.json package-lock.json index.html vite.config.js server src .gitignore
git commit -m "test: verify ai poster tool"
```

If no code changes were required after Task 5, leave this step without a commit.

## Self-Review

- Spec coverage: The plan covers React + Vite frontend, Express backend, no database, `/api/copy`, `/api/poster`, environment value normalization, direct image generation, editable AI copy, template guidance, loading and error states, download, backend tests, frontend workflow tests, and production build verification.
- Placeholder scan: The plan uses concrete file paths, concrete commands, complete code blocks for new code files, and expected outputs for verification steps.
- Type consistency: The copy shape is consistent across backend helpers, API routes, frontend state, and tests: `title`, `subtitle`, `sellingPoints`, `callToAction`, `visualStyle`, and `imagePrompt`.
