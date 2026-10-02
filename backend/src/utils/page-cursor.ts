import { z } from 'zod';

export type PageCursorScope = 'favorite' | 'review';

export interface PageCursorPosition {
  createdAt: string;
  id: string;
}

const cursorPayloadSchema = z.object({
  version: z.literal(1),
  scope: z.enum(['favorite', 'review']),
  createdAt: z.string().datetime(),
  id: z.string().uuid(),
}).strict();

export class InvalidPageCursorError extends Error {
  constructor() {
    super('The page cursor is invalid.');
    this.name = 'InvalidPageCursorError';
  }
}

export function encodePageCursor(
  scope: PageCursorScope,
  position: PageCursorPosition,
): string {
  const payload = cursorPayloadSchema.parse({ version: 1, scope, ...position });
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodePageCursor(
  cursor: string,
  expectedScope: PageCursorScope,
): PageCursorPosition {
  try {
    if (cursor.length < 1 || cursor.length > 256 || !/^[A-Za-z0-9_-]+$/.test(cursor)) {
      throw new InvalidPageCursorError();
    }
    const json = Buffer.from(cursor, 'base64url').toString('utf8');
    if (Buffer.from(json, 'utf8').toString('base64url') !== cursor) {
      throw new InvalidPageCursorError();
    }
    const payload = cursorPayloadSchema.parse(JSON.parse(json));
    if (payload.scope !== expectedScope) throw new InvalidPageCursorError();
    return { createdAt: payload.createdAt, id: payload.id };
  } catch (error) {
    if (error instanceof InvalidPageCursorError) throw error;
    throw new InvalidPageCursorError();
  }
}
