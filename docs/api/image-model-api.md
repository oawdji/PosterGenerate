# Image Model API

This document describes how this project connects to the image model used for full poster generation and local poster edits.

## Purpose

The image model creates a complete square poster image from structured copy, template guidance, and optional local edit instructions.

Project entry points:

- Full poster route: `POST /api/poster`
- Local edit route: `POST /api/poster/edit`
- Full poster service: `generatePoster(config, payload)` in `server/ai.js`
- Local edit service: `generateEditedPoster(config, payload)` in `server/ai.js`
- Prompt builders: `buildPosterPrompt(payload)` and `buildPosterEditPrompt(payload)` in `server/prompts.js`

## Environment Variables

```bash
AI_IMAGE_API_KEY=your-image-model-api-key
AI_IMAGE_BASE_URL=https://api.example.com
AI_IMAGE_MODEL=your-image-model-name
```

The app trims wrapping quotes and extra whitespace from these values in `server/env.js`.

## Upstream Request

The server calls an OpenAI-compatible image generation endpoint.

```http
POST {AI_IMAGE_BASE_URL}/v1/images/generations
Content-Type: application/json
Authorization: Bearer {AI_IMAGE_API_KEY}
```

Full poster request body:

```json
{
  "model": "AI_IMAGE_MODEL",
  "prompt": "生成一张完整的中文商业海报...",
  "size": "1024x1024",
  "quality": "auto",
  "n": 1
}
```

Local edit request body also uses `/v1/images/generations`. The prompt is written in Chinese and includes the selected point and edit instruction:

```json
{
  "model": "AI_IMAGE_MODEL",
  "prompt": "生成一张完整的中文商业海报...\n局部修改要求：\n选中位置：从海报左上角计算，x 25%，y 75%...\n用户修改指令：把这里改成红色按钮...",
  "size": "1024x1024",
  "quality": "auto",
  "n": 1
}
```

The current implementation intentionally does not call a provider-specific multipart image edit endpoint. This keeps compatibility with OpenAI-compatible generation providers.

## Image Options

The frontend sends image settings as `imageOptions`.

```json
{
  "quality": "high",
  "aspectRatio": "16:9"
}
```

Supported quality values:

- `auto`
- `low`
- `medium`
- `high`

Supported standard ratios in the UI:

- `1:1`
- `3:4`
- `4:3`
- `9:16`
- `16:9`
- Custom width and height, converted to a ratio such as `3:4`

The image API only receives supported generation sizes. The server maps ratios to sizes:

- Square or near-square ratios: `1024x1024`
- Landscape ratios: `1536x1024`
- Portrait ratios: `1024x1536`

The exact target ratio is also written into the prompt as `目标画幅比例：...`, so custom ratios still guide the composition even when they map to the closest supported API size.

## Expected Upstream Response

The project expects a base64 image at:

```js
response.data[0].b64_json
```

The server converts it to a browser-ready data URL:

```text
data:image/png;base64,{b64_json}
```

## Client-Facing Full Poster API

```http
POST /api/poster
Content-Type: application/json
```

Request body:

```json
{
  "template": "commercial",
  "imageOptions": {
    "quality": "high",
    "aspectRatio": "16:9"
  },
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

Success response:

```json
{
  "image": "data:image/png;base64,..."
}
```

Validation error:

```json
{
  "message": "Please generate or enter poster copy before creating an image."
}
```

Provider error:

```json
{
  "message": "Poster generation failed. Please adjust the description and try again."
}
```

## Client-Facing Local Edit API

```http
POST /api/poster/edit
Content-Type: application/json
```

Request body:

```json
{
  "template": "commercial",
  "imageOptions": {
    "quality": "medium",
    "aspectRatio": "3:4"
  },
  "copy": {
    "title": "周末新品上市",
    "subtitle": "咖啡与甜点限时组合",
    "sellingPoints": ["精品咖啡", "手作甜点", "周末限定"],
    "callToAction": "立即到店尝鲜",
    "visualStyle": "warm premium coffee poster",
    "imagePrompt": "温暖高级的咖啡店促销海报，中文文字清晰可读"
  },
  "selection": {
    "x": 0.25,
    "y": 0.75
  },
  "instruction": "把这里改成红色按钮"
}
```

`selection.x` and `selection.y` are normalized coordinates from 0 to 1, measured from the top-left corner of the displayed poster.

Success response:

```json
{
  "image": "data:image/png;base64,..."
}
```

Validation error:

```json
{
  "message": "Please click a poster location and describe the local edit."
}
```

Provider error:

```json
{
  "message": "Poster edit failed. Please adjust the local edit and try again."
}
```

## Timeout And Error Handling

All model JSON requests use `AbortSignal.timeout(120000)` in `requestJson`, so an upstream request has a 120 second boundary.

If the upstream response does not include `data[0].b64_json`, the service throws `Image response did not include b64_json`.
