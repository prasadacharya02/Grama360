import type { Pool, QueryResultRow } from 'pg';

import { getDatabasePool } from '../../db/pool.js';
import type { CategoryLanguage, CategoryStore, ServiceCategoryView } from './categories.types.js';

interface CategoryRow extends QueryResultRow {
  id: string;
  parentId: string | null;
  slug: string;
  name: string;
  iconKey: string | null;
  sortOrder: number;
}

export class PostgresCategoryStore implements CategoryStore {
  constructor(private readonly getPool: () => Pool = getDatabasePool) {}

  async listActive(language: CategoryLanguage): Promise<ServiceCategoryView[]> {
    const result = await this.getPool().query<CategoryRow>(
      `
        SELECT
          category.id::TEXT AS id,
          category.parent_id::TEXT AS "parentId",
          category.slug,
          CASE WHEN $1 = 'kn' THEN category.name_kn ELSE category.name_en END AS name,
          category.icon_key AS "iconKey",
          category.sort_order AS "sortOrder"
        FROM service_categories AS category
        WHERE category.is_active = TRUE
        ORDER BY category.sort_order, category.name_en, category.id
      `,
      [language],
    );

    return result.rows;
  }
}
