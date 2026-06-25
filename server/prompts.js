import { getTemplateGuide, normalizeTemplate } from './templates.js';

export function buildCopyMessages({ requirement, template }) {
  const templateGuide = getTemplateGuide(template);

  return [
    {
      role: 'system',
      content:
        '你是一位资深中文广告文案策划和海报美术指导。只返回严格 JSON，不要返回 Markdown。JSON 对象必须包含 title、subtitle、sellingPoints、callToAction、visualStyle、imagePrompt。',
    },
    {
      role: 'user',
      content: [
        `用户需求：${requirement}`,
        `海报模板：${templateGuide.label}`,
        `模板视觉方向：${templateGuide.prompt}`,
        '请面向中国大陆市场生成简洁、有商业转化感的中文海报文案。',
        'sellingPoints 必须是 3 个短中文字符串组成的数组。',
        'imagePrompt 必须是中文视觉提示词，用于生成完整中文海报画面，并提醒模型清晰呈现文案。',
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
    '生成一张完整的中文商业海报，不是背景图，也不是样机图。',
    `海报类型：${templateGuide.label}。`,
    `视觉方向：${templateGuide.prompt}。`,
    safeCopy.visualStyle ? `整体风格：${safeCopy.visualStyle}。` : '',
    safeCopy.imagePrompt ? `画面提示：${safeCopy.imagePrompt}。` : '',
    '请在画面中清晰呈现以下中文文案，必须逐字准确，不要增删、改写或生成错别字：',
    safeCopy.title ? `主标题：「${safeCopy.title}」` : '',
    safeCopy.subtitle ? `副标题：「${safeCopy.subtitle}」` : '',
    sellingPoints ? `卖点：「${sellingPoints}」` : '',
    safeCopy.callToAction ? `行动语：「${safeCopy.callToAction}」` : '',
    '设计要求：适合中国大陆市场审美，中文字体清晰易读，商业感强，排版层级明确，画面精致，高分辨率正方形构图。',
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildPosterEditPrompt({ copy, template, selection, instruction }) {
  const basePrompt = buildPosterPrompt({ copy, template });
  const xPercent = Math.round(Number(selection?.x || 0) * 100);
  const yPercent = Math.round(Number(selection?.y || 0) * 100);

  return [
    basePrompt,
    '局部修改要求：',
    `选中位置：从海报左上角计算，x ${xPercent}%，y ${yPercent}%。`,
    `用户修改指令：${instruction}`,
    '请优先在选中位置附近应用修改。除非用户明确要求，否则保持海报其他区域不变，包括布局、文字层级、颜色、商品细节和整体风格。',
    '返回一张完整的中文商业海报成图。',
  ].join('\n');
}
