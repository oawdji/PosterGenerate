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

function normalizeSelection(selection) {
  const x = Number(selection?.x);
  const y = Number(selection?.y);

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }

  return {
    x: Math.min(1, Math.max(0, x)),
    y: Math.min(1, Math.max(0, y)),
  };
}

export function createApp({ services }) {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '20mb' }));

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
      const image = await services.generatePoster({ copy, template, imageOptions: request.body?.imageOptions });
      response.json({ image });
    } catch (error) {
      console.error('Poster generation failed:', error);
      response.status(502).json({ message: 'Poster generation failed. Please adjust the description and try again.' });
    }
  });

  app.post('/api/poster/edit', async (request, response) => {
    const instruction = typeof request.body?.instruction === 'string' ? request.body.instruction.trim() : '';
    const selection = normalizeSelection(request.body?.selection);
    const copy = normalizeCopy(request.body?.copy);
    const template = normalizeTemplate(request.body?.template);

    if (!instruction || !selection) {
      response.status(400).json({ message: 'Please click a poster location and describe the local edit.' });
      return;
    }

    try {
      const editedImage = await services.editPoster({
        copy,
        template,
        imageOptions: request.body?.imageOptions,
        selection,
        instruction,
      });
      response.json({ image: editedImage });
    } catch (error) {
      console.error('Poster edit failed:', error);
      response.status(502).json({ message: 'Poster edit failed. Please adjust the local edit and try again.' });
    }
  });

  return app;
}
