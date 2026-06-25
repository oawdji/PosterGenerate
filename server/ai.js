import { buildCopyMessages, buildPosterEditPrompt, buildPosterPrompt } from './prompts.js';

function joinUrl(baseUrl, path) {
  return `${String(baseUrl).replace(/\/+$/, '')}${path}`;
}

function isRemoteUrl(value) {
  return /^https?:\/\//i.test(value);
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
  const image = response?.data?.[0];
  const base64 = image?.b64_json;
  if (!base64) {
    const url = typeof image?.url === 'string' ? image.url.trim() : '';
    if (url) return url;

    throw new Error('Image response did not include b64_json or url');
  }

  return `data:image/png;base64,${base64}`;
}

export async function resolveImageDataUrl(response) {
  const image = formatImageDataUrl(response);

  if (!isRemoteUrl(image)) {
    return image;
  }

  const responseFromUrl = await fetch(image, {
    signal: AbortSignal.timeout(120000),
  });

  if (!responseFromUrl.ok) {
    throw new Error(`Image download failed with status ${responseFromUrl.status}`);
  }

  const contentType = responseFromUrl.headers.get('content-type')?.split(';')[0] || 'image/png';
  const buffer = Buffer.from(await responseFromUrl.arrayBuffer());

  return `data:${contentType};base64,${buffer.toString('base64')}`;
}

export async function requestJson({ baseUrl, apiKey, path, body, timeoutMs = 120000 }) {
  const response = await fetch(joinUrl(baseUrl, path), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
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
      max_tokens: 600,
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

  return resolveImageDataUrl(imageResponse);
}

export async function generateEditedPoster(config, payload) {
  const imageResponse = await requestJson({
    baseUrl: config.image.baseUrl,
    apiKey: config.image.apiKey,
    path: '/v1/images/generations',
    body: {
      model: config.image.model,
      prompt: buildPosterEditPrompt(payload),
      size: '1024x1024',
      n: 1,
    },
  });

  return resolveImageDataUrl(imageResponse);
}
