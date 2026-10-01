import { Router } from 'express';
import { z } from 'zod';

import type { CategoryStore } from './categories.types.js';
import { PostgresCategoryStore } from './postgres-category-store.js';

const languageSchema = z.enum(['en', 'kn']).default('en');

export function createCategoriesRouter(store: CategoryStore = new PostgresCategoryStore()): Router {
  const router = Router();

  router.get('/categories', async (request, response) => {
    const parsedLanguage = languageSchema.safeParse(request.query.language ?? 'en');
    if (!parsedLanguage.success) {
      response.status(400).json({
        error: { code: 'INVALID_LANGUAGE', message: 'Choose language en or kn.' },
      });
      return;
    }

    const categories = await store.listActive(parsedLanguage.data);
    response.status(200).json({ categories });
  });

  return router;
}
