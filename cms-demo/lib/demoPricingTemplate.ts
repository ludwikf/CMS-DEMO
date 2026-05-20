

export const DEMO_WIDTHS_M = [0.5, 1.0, 1.5, 2.0];
export const DEMO_HEIGHTS_M = [0.5, 1.0, 1.5, 2.0];

export type DemoPricingTable = {
  widths: number[];
  heights: number[];
  prices: number[][];
};

export type DemoPricingInput = {
  type: string;
  values: { value: string; price: number }[];
};

export type DemoSubTemplate = {
  TABLES: DemoPricingTable[];
  INPUTS: DemoPricingInput[];
};

export function createDefaultPrices(): number[][] {
  return DEMO_HEIGHTS_M.map((h) =>
    DEMO_WIDTHS_M.map((w) => Math.round(w * h * 100))
  );
}

export function createDefaultSubTemplate(): DemoSubTemplate {
  return {
    TABLES: [
      {
        widths: [...DEMO_WIDTHS_M],
        heights: [...DEMO_HEIGHTS_M],
        prices: createDefaultPrices(),
      },
    ],
    INPUTS: [
      {
        type: "COLOR",
        values: [
          { value: "Standard", price: 0 },
          { value: "Premium", price: 50 },
        ],
      },
      {
        type: "MODEL",
        values: [
          { value: "Podstawowy", price: 0 },
          { value: "Rozszerzony", price: 30 },
        ],
      },
    ],
  };
}

export function createDefaultTemplate(): Record<string, DemoSubTemplate> {
  return { main: createDefaultSubTemplate() };
}


export function parseSubTemplate(raw: unknown): DemoSubTemplate {
  if (!raw || typeof raw !== "object") {
    return createDefaultSubTemplate();
  }
  const obj = raw as Record<string, unknown>;
  const tables = Array.isArray(obj.TABLES) ? obj.TABLES : [];
  const first = tables[0] as DemoPricingTable | undefined;

  return {
    TABLES: [
      {
        widths: first?.widths?.length ? first.widths : [...DEMO_WIDTHS_M],
        heights: first?.heights?.length ? first.heights : [...DEMO_HEIGHTS_M],
        prices:
          first?.prices?.length ? first.prices : createDefaultPrices(),
      },
    ],
    INPUTS: Array.isArray(obj.INPUTS)
      ? (obj.INPUTS as DemoPricingInput[])
      : createDefaultSubTemplate().INPUTS,
  };
}

export function getMainSubTemplate(
  template: Record<string, unknown> | null | undefined
): DemoSubTemplate {
  if (!template || typeof template !== "object") {
    return createDefaultSubTemplate();
  }
  if (template.main) return parseSubTemplate(template.main);
  const firstKey = Object.keys(template)[0];
  if (firstKey) return parseSubTemplate(template[firstKey]);
  return createDefaultSubTemplate();
}
