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
