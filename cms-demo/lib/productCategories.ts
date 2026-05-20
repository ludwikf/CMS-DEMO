

export const PRODUCT_CATEGORIES = [
  { key: "KATEGORIA_A", label: "Kategoria A" },
  { key: "KATEGORIA_B", label: "Kategoria B" },
  { key: "KATEGORIA_C", label: "Kategoria C" },
  { key: "KATEGORIA_D", label: "Kategoria D" },
  { key: "KATEGORIA_E", label: "Kategoria E" },
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]["key"];

export const PRODUCT_CATEGORY_KEYS = PRODUCT_CATEGORIES.map((c) => c.key) as [
  ProductCategory,
  ...ProductCategory[]
];

export function normalizeCategoryKey(key: string): ProductCategory | string {
  if (isValidProductCategory(key)) return key;
  return key;
}

export function getCategoryLabel(categoryKey: string): string {
  const normalized = normalizeCategoryKey(categoryKey);
  const found = PRODUCT_CATEGORIES.find((c) => c.key === normalized);
  return found?.label ?? categoryKey;
}


export const categories = PRODUCT_CATEGORIES.map((c) => ({
  key: c.key,
  label: c.label,
}));

export function isValidProductCategory(
  value: string | null | undefined
): value is ProductCategory {
  return (
    !!value && (PRODUCT_CATEGORY_KEYS as readonly string[]).includes(value)
  );
}


export function getCategoryFilterValues(categoryKey: string): string[] {
  const normalized = normalizeCategoryKey(categoryKey);
  return Array.from(new Set([normalized, categoryKey]));
}
