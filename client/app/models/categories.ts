export type Categories = Record<string, Category>;

export interface Category {
  name: string;
  color: string;
};

export const DIFF_CATEGORY = '__diff__';
