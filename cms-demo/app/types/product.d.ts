export type ProductCategory =
  | "KATEGORIA_A"
  | "KATEGORIA_B"
  | "KATEGORIA_C"
  | "KATEGORIA_D"
  | "KATEGORIA_E";

export type ProductStatus = "ACTIVE" | "INACTIVE" | "TEST";


export type ProductInputType = "WIDTH" | "HEIGHT" | "COLOR" | "MODEL";

export interface ProductInputConfig {
  type: ProductInputType;
  default?: number | string | null;
  values?: string[];
  required?: boolean;
}

export interface Product {
  id: string;
  category: ProductCategory;
  variant: string;
  status: ProductStatus;
  inputs: ProductInputConfig[];
  inputsBySubvariant?: Record<string, ProductInputConfig[]>;
  createdAt: Date;
  updatedAt: Date;
  subvariants?: string[];
  pricingTemplate?: {
    id: string;
    name: string;
    template?: Record<string, unknown> | null;
  } | null;
}

export type CreateProductInput = Omit<
  Product,
  "id" | "createdAt" | "updatedAt"
>;
