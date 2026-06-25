# Text Model API

This document describes how this project connects to the large language model used for poster copy generation.

## Purpose

The text model turns a user's poster requirement and selected template into structured Chinese poster copy.

Project entry points:

- Server route: `POST /api/copy`
- Service function: `generateCopy(config, payload)` in `server/ai.js`
- Prompt builder: `buildCopyMessages(payload)` in `server/prompts.js`

## Environment Variables

```bash
AI_API_KEY=your-text-model-api-key
AI_BASE_URL=https://api.example.com
AI_MODEL=your-text-model-name
```

The app trims wrapping quotes and extra whitespace from these values in `server/env.js`.

## Upstream Request

The server calls an OpenAI-compatible chat completions endpoint.

```http
POST {AI_BASE_URL}/v1/chat/completions
Content-Type: application/json
Authorization: Bearer {AI_API_KEY}
```

Request body:

```json
{
  "model": "AI_MODEL",
  "messages": [
    {
      "role": "system",
      "content": "你是一位资深中文广告文案策划和海报美术指导。只返回严格 JSON..."
    },
    {
      "role": "user",
      "content": "用户需求：...\n海报模板：...\n模板视觉方向：...\n请面向中国大陆市场生成..."
    }
  ],
  "temperature": 0.7,
  "max_tokens": 600
}
```

## Expected Upstream Response

The project expects the model response at:

```js
completion.choices[0].message.content
```

That content must include a JSON object. The app extracts the first JSON object from the text and normalizes it.

Expected JSON shape:

```json
{
  "title": "周末新品上市",
  "subtitle": "咖啡与甜点限时组合",
  "sellingPoints": ["精品咖啡", "手作甜点", "周末限定"],
  "callToAction": "立即到店尝鲜",
  "visualStyle": "warm premium coffee poster",
  "imagePrompt": "温暖高级的咖啡店促销海报，中文文字清晰可读"
}
```

## Client-Facing API

Frontend calls the local app endpoint, not the model provider directly.

```http
POST /api/copy
Content-Type: application/json
```

Request body:

```json
{
  "requirement": "给咖啡店做一张周末新品促销海报",
  "template": "commercial"
}
```

Success response:

```json
{
  "copy": {
    "title": "周末新品上市",
    "subtitle": "咖啡与甜点限时组合",
    "sellingPoints": ["精品咖啡", "手作甜点", "周末限定"],
    "callToAction": "立即到店尝鲜",
    "visualStyle": "warm premium coffee poster",
    "imagePrompt": "温暖高级的咖啡店促销海报，中文文字清晰可读"
  }
}
```

Validation error:

```json
{
  "message": "Please describe the poster you want to create."
}
```

Provider error:

```json
{
  "message": "Copy generation failed. Please try again."
}
```

## Timeout And Error Handling

All model JSON requests use `AbortSignal.timeout(120000)` in `requestJson`, so an upstream request has a 120 second boundary.

If the upstream response is not OK, the server prefers `data.error.message`; otherwise it returns `AI request failed with status {status}` internally and maps it to the client-facing error above.
