export function findClosestIndex(arr: number[], value: number) {
  for (let i = 0; i < arr.length; i++) {
    if (value <= arr[i]) return i;
  }
  return arr.length - 1;
}

export interface Product {
  id?: string;
  subvariants?: string[];
  inputsBySubvariant?: Record<string, ProductInput[]>;
  inputs?: ProductInput[] | Record<string, ProductInput[]>;
}

export interface ProductInput {
  type: string;
  values?: unknown[];
  default?: unknown;
  required?: boolean;
}

export interface ProductConfig {
  subvariant?: string;
  [key: string]: unknown;
}

export type ProductInputConfig = {
  id: string;
  label: string;
  type: "number" | "select" | "checkbox" | "handle";
  configKey: string;
  validationKey: string;
  placeholder: string;
  noOptionsText?: string;
  hasValues?: boolean;
  hasDefault?: boolean;
  hasRequired?: boolean;
  enabledByDefault?: boolean;
  min?: number;
  step?: number;
  unit?: string;
  rangeType?: "width" | "height";
  hasRange?: boolean;
  pairedWith?: string;
  hasCustomLogic?: boolean;
  getValues?: (
    product: Product | null,
    config: ProductConfig | null
  ) => unknown[];
};

function getMainInputs(product: Product | null): ProductInput[] {
  if (!product) return [];
  if (product.inputsBySubvariant?.main) return product.inputsBySubvariant.main;
  if (Array.isArray(product.inputs)) return product.inputs;
  if (
    product.inputs &&
    typeof product.inputs === "object" &&
    "main" in product.inputs
  ) {
    return (product.inputs as Record<string, ProductInput[]>).main ?? [];
  }
  return [];
}

function extractInputValues(
  product: Product | null,
  _config: ProductConfig | null,
  inputType: string
): unknown[] {
  const input = getMainInputs(product).find((i) => i.type === inputType);
  return (input?.values as unknown[]) ?? [];
}

export const PRODUCT_INPUT_TYPES: ProductInputConfig[] = [
  {
    id: "WIDTH",
    label: "Szerokość",
    type: "number",
    configKey: "width",
    validationKey: "width",
    placeholder: "Szerokość (mm)",
    hasDefault: true,
    hasRequired: true,
    enabledByDefault: true,
    min: 0,
    step: 1,
    unit: "mm",
  },
  {
    id: "HEIGHT",
    label: "Wysokość",
    type: "number",
    configKey: "height",
    validationKey: "height",
    placeholder: "Wysokość (mm)",
    hasDefault: true,
    hasRequired: true,
    enabledByDefault: true,
    min: 0,
    step: 1,
    unit: "mm",
  },
  {
    id: "COLOR",
    label: "Wariant / kolor",
    type: "select",
    configKey: "color",
    validationKey: "color",
    placeholder: "Wybierz wariant",
    noOptionsText: "Brak opcji",
    hasDefault: true,
    hasRequired: false,
    hasValues: true,
    getValues: (product, config) =>
      extractInputValues(product, config, "COLOR"),
  },
  {
    id: "MODEL",
    label: "Model",
    type: "select",
    configKey: "model",
    validationKey: "model",
    placeholder: "Wybierz model",
    noOptionsText: "Brak modeli",
    hasDefault: true,
    hasRequired: false,
    hasValues: true,
    getValues: (product, config) =>
      extractInputValues(product, config, "MODEL"),
  },
];

export const ORDER_DISPLAY_CONFIG_KEYS = PRODUCT_INPUT_TYPES.map(
  (p) => p.configKey
);

export function getInputConfigById(id: string): ProductInputConfig | undefined {
  return PRODUCT_INPUT_TYPES.find((input) => input.id === id);
}

export function getInputConfigByConfigKey(
  configKey: string
): ProductInputConfig | undefined {
  return PRODUCT_INPUT_TYPES.find((input) => input.configKey === configKey);
}

export function validateInputValue(
  config: ProductInputConfig,
  value: unknown
): { isValid: boolean; error?: string } {
  if (
    config.hasRequired &&
    (value === null || value === undefined || value === "")
  ) {
    return { isValid: false, error: `${config.label} jest wymagane` };
  }
  if (
    config.type === "number" &&
    typeof value === "number" &&
    config.min !== undefined
  ) {
    if (value < config.min) {
      return {
        isValid: false,
        error: `${config.label} musi być ≥ ${config.min}`,
      };
    }
  }
  return { isValid: true };
}

export function formatValueForDisplay(
  config: ProductInputConfig,
  value: unknown
): string {
  if (value === null || value === undefined || value === "") return "";
  if (config.type === "number" && config.unit) return `${value} ${config.unit}`;
  return String(value);
}

export function parseValueFromInput(
  config: ProductInputConfig,
  value: string
): unknown {
  if (config.type === "number") {
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return value;
}

export function getDefaultValue(config: ProductInputConfig): unknown {
  if (config.type === "number") return config.min ?? 0;
  return "";
}
