import { findClosestIndex } from "@/app/contexts/inputTypes";
import {
  DEMO_HEIGHTS_M,
  DEMO_WIDTHS_M,
  getMainSubTemplate,
} from "@/lib/demoPricingTemplate";

export type PriceableConfiguration = {
  width?: string | number;
  height?: string | number;
  color?: string;
  model?: string;
  quantity?: number;
  price?: number;
  needsIndividualQuote?: boolean;
  [key: string]: unknown;
};

export type PriceableProduct = {
  id?: string;
  pricingTemplate?: {
    id: string;
    name?: string;
    template?: unknown;
  } | null;
};

export type SubmittedCartProduct = {
  id: string;
  variant: string;
  category: string;
  quantity: number;
  configurations: PriceableConfiguration[];
};

export type WidthHeightRange = {
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
};

export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function getSubTemplate(product: PriceableProduct) {
  const template = product.pricingTemplate?.template;
  if (!template || typeof template !== "object") return null;
  return getMainSubTemplate(template as Record<string, unknown>);
}

export function getWidthHeightRange(
  product: PriceableProduct,
  _config?: PriceableConfiguration
): WidthHeightRange {
  const sub = getSubTemplate(product);
  if (!sub?.TABLES[0]) return {};
  const table = sub.TABLES[0];
  const widths = table.widths ?? DEMO_WIDTHS_M;
  const heights = table.heights ?? DEMO_HEIGHTS_M;
  return {
    minWidth: Math.round(Math.min(...widths) * 1000),
    maxWidth: Math.round(Math.max(...widths) * 1000),
    minHeight: Math.round(Math.min(...heights) * 1000),
    maxHeight: Math.round(Math.max(...heights) * 1000),
  };
}

export function needsCustomPricing(
  product: PriceableProduct,
  config: PriceableConfiguration
): boolean {
  if (!product?.pricingTemplate?.id || !config.width || !config.height) {
    return false;
  }
  const range = getWidthHeightRange(product, config);
  const width = parseFloat(String(config.width));
  const height = parseFloat(String(config.height));
  if (Number.isNaN(width) || Number.isNaN(height)) return false;
  if (range.maxWidth == null || range.maxHeight == null) return false;
  return width > range.maxWidth || height > range.maxHeight;
}

export function needsIndividualQuote(
  product: PriceableProduct,
  config: PriceableConfiguration
): boolean {
  return !product?.pricingTemplate?.id || needsCustomPricing(product, config);
}

function addonPrice(
  subTemplate: ReturnType<typeof getMainSubTemplate>,
  type: string,
  fieldValue: unknown
): number {
  if (!fieldValue) return 0;
  const input = subTemplate.INPUTS.find(
    (i) => i.type?.toUpperCase() === type
  );
  if (!input?.values) return 0;
  const found = input.values.find((v) => v.value === fieldValue);
  return typeof found?.price === "number" ? found.price : 0;
}

export function calculateConfigurationPrice(
  product: PriceableProduct,
  config: PriceableConfiguration
): number {
  if (!product?.pricingTemplate?.id || !config.width || !config.height) {
    return 0;
  }
  if (needsCustomPricing(product, config)) return 0;

  const subTemplate = getSubTemplate(product);
  const table = subTemplate?.TABLES[0];
  if (!table) return 0;

  const widthM = parseFloat(String(config.width)) / 1000;
  const heightM = parseFloat(String(config.height)) / 1000;
  if (Number.isNaN(widthM) || Number.isNaN(heightM)) return 0;

  const wIdx = findClosestIndex(table.widths, widthM);
  const hIdx = findClosestIndex(table.heights, heightM);
  let price = table.prices?.[hIdx]?.[wIdx] ?? 0;

  price += addonPrice(subTemplate!, "COLOR", config.color);
  price += addonPrice(subTemplate!, "MODEL", config.model);

  return price;
}

export function enrichConfigurationWithPricing(
  product: PriceableProduct,
  config: PriceableConfiguration
) {
  return {
    ...config,
    price: roundCurrency(calculateConfigurationPrice(product, config)),
    needsIndividualQuote: needsIndividualQuote(product, config),
  };
}

export function calculateConfigurationsTotal(
  configurations: Array<PriceableConfiguration & { price?: number }>
): number {
  return roundCurrency(
    configurations.reduce(
      (sum, config) => sum + (config.price ?? 0) * (config.quantity ?? 1),
      0
    )
  );
}

export function recalculateSubmittedProduct(
  product: SubmittedCartProduct,
  dbProduct: PriceableProduct
) {
  const configurations = product.configurations.map((config) =>
    enrichConfigurationWithPricing(dbProduct, config)
  );
  return {
    ...product,
    configurations,
    quantity: product.quantity,
    totalAmount: calculateConfigurationsTotal(configurations),
  };
}

export function recalculateCartProducts(
  products: SubmittedCartProduct[],
  dbProductsById: Map<string, PriceableProduct>
) {
  const recalculatedProducts = products.map((product) => {
    const dbProduct = dbProductsById.get(product.id);
    if (!dbProduct) {
      throw new Error(`Product ${product.id} not found for pricing.`);
    }
    return recalculateSubmittedProduct(product, dbProduct);
  });

  return {
    products: recalculatedProducts.map(({ totalAmount, ...product }) => product),
    totalAmount: roundCurrency(
      recalculatedProducts.reduce((sum, p) => sum + p.totalAmount, 0)
    ),
  };
}

export function getProductPricingTemplate() {
  return null;
}
export function getSelectedPricingSubTemplate() {
  return null;
}
export function getSelectedPricingTable() {
  return null;
}
