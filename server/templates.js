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
