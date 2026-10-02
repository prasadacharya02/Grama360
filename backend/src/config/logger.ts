import pino from 'pino';

import { env } from './env.js';

export const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'headers.authorization',
      'headers.cookie',
      '*.phone_e164',
      '*.phoneNumber',
    ],
    censor: '[REDACTED]',
  },
});
