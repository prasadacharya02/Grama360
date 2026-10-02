export type CategoryLanguage = 'en' | 'kn';

export interface ServiceCategoryView {
  id: string;
  parentId: string | null;
  slug: string;
  name: string;
  iconKey: string | null;
  sortOrder: number;
}

export interface CategoryStore {
  listActive(language: CategoryLanguage): Promise<ServiceCategoryView[]>;
}
