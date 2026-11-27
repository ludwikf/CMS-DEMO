import { describe, it, expect } from "vitest";
import {
  roundCurrency,
  getWidthHeightRange,
  needsCustomPricing,
  needsIndividualQuote,
  calculateConfigurationPrice,
  enrichConfigurationWithPricing,
  calculateConfigurationsTotal,
  recalculateCartProducts,
  type PriceableProduct,
} from "@/lib/pricing";
import { createDefaultTemplate } from "@/lib/demoPricingTemplate";

const defaultProduct: PriceableProduct = {
  id: "prod-1",
  pricingTemplate: {
    id: "tpl-1",
    name: "Cennik standardowy",
    template: createDefaultTemplate(),
  },
};

const unpricedProduct: PriceableProduct = {
  id: "prod-no-tpl",
  pricingTemplate: null,
};

describe("pricing engine", () => {
  it("rounds currency values to 2 decimal places", () => {
    expect(roundCurrency(10.126)).toBe(10.13);
    expect(roundCurrency(19.994)).toBe(19.99);
    expect(roundCurrency(0.1 + 0.2)).toBe(0.3);
  });

  it("extracts width/height range in mm from pricing template", () => {
    expect(getWidthHeightRange(defaultProduct)).toEqual({
      minWidth: 500,
      maxWidth: 2000,
      minHeight: 500,
      maxHeight: 2000,
    });
    expect(getWidthHeightRange(unpricedProduct)).toEqual({});
  });

  it("detects custom pricing and individual quote requirements", () => {
    expect(
      needsCustomPricing(defaultProduct, { width: 1000, height: 1000 })
    ).toBe(false);
    expect(
      needsCustomPricing(defaultProduct, { width: 2500, height: 1000 })
    ).toBe(true);
    expect(
      needsCustomPricing(defaultProduct, { width: 1000, height: 2200 })
    ).toBe(true);

    expect(
      needsIndividualQuote(defaultProduct, { width: 1500, height: 1500 })
    ).toBe(false);
    expect(
      needsIndividualQuote(defaultProduct, { width: 2100, height: 1000 })
    ).toBe(true);
    expect(
      needsIndividualQuote(unpricedProduct, { width: 1000, height: 1000 })
    ).toBe(true);
  });

  it("calculates base matrix price and addon surcharges", () => {
    // 1000x1000 mm -> 1.0m x 1.0m -> 100
    expect(
      calculateConfigurationPrice(defaultProduct, { width: 1000, height: 1000 })
    ).toBe(100);

    // 800x1200 mm rounds up to 1.0m x 1.5m (150) + Premium (+50) + Rozszerzony (+30) = 230
    expect(
      calculateConfigurationPrice(defaultProduct, {
        width: 800,
        height: 1200,
        color: "Premium",
        model: "Rozszerzony",
      })
    ).toBe(230);

    // Out-of-range or missing template returns 0
    expect(
      calculateConfigurationPrice(defaultProduct, { width: 2500, height: 1000 })
    ).toBe(0);
    expect(
      calculateConfigurationPrice(unpricedProduct, { width: 1000, height: 1000 })
    ).toBe(0);
  });

  it("enriches configuration and recalculates cart totals server-side", () => {
    const enriched = enrichConfigurationWithPricing(defaultProduct, {
      width: 1000,
      height: 1000,
      color: "Premium",
      quantity: 2,
      price: 1, // spoofed client price should be ignored
    });

    expect(enriched.price).toBe(150);
    expect(enriched.needsIndividualQuote).toBe(false);
    expect(calculateConfigurationsTotal([enriched])).toBe(300);

    const dbProducts = new Map<string, PriceableProduct>([
      ["prod-1", defaultProduct],
    ]);

    const recalculated = recalculateCartProducts(
      [
        {
          id: "prod-1",
          variant: "Produkt Standard A",
          category: "KATEGORIA_A",
          quantity: 1,
          configurations: [
            { width: 500, height: 500, quantity: 3, price: 0 },
          ],
        },
      ],
      dbProducts
    );

    expect(recalculated.totalAmount).toBe(75);
    expect(recalculated.products[0].configurations[0].price).toBe(25);
  });

  it("throws when recalculating cart with a missing product", () => {
    expect(() =>
      recalculateCartProducts(
        [
          {
            id: "missing-id",
            variant: "Brak",
            category: "KATEGORIA_A",
            quantity: 1,
            configurations: [{ width: 1000, height: 1000, quantity: 1 }],
          },
        ],
        new Map()
      )
    ).toThrow("Product missing-id not found for pricing.");
  });
});
