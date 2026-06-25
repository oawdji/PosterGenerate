import dotenv from 'dotenv';

export function cleanEnvValue(value) {
  if (value === undefined || value === null) return '';
  return String(value)
    .trim()
    .replace(/^[ "'“”‘’]+|[ "'“”‘’]+$/g, '');
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
