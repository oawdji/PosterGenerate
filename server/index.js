import { generateCopy, generateEditedPoster, generatePoster } from './ai.js';
import { createApp } from './app.js';
import { loadConfig } from './env.js';

const config = loadConfig();

const app = createApp({
  services: {
    generateCopy: (payload) => generateCopy(config, payload),
    generatePoster: (payload) => generatePoster(config, payload),
    editPoster: (payload) => generateEditedPoster(config, payload),
  },
});

app.listen(config.port, '127.0.0.1', () => {
  console.log(`AI poster API listening on http://127.0.0.1:${config.port}`);
});
