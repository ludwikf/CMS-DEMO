import { describe, it, expect } from "vitest";
import { validateProduct, validateProductWithZod } from "@/lib/productValidation";

const validProduct = {
  category: "KATEGORIA_A",
  variant: "Produkt Standard A",
  status: "ACTIVE",
  pricingTemplateId: "tpl-1",
  inputsBySubvariant: {
    main: [
      { type: "WIDTH", default: 1000, required: true },
      { type: "HEIGHT", default: 1000, required: true },
      { type: "COLOR", values: ["Standard", "Premium"], required: false },
    ],
  },
};

describe("productValidation", () => {
  it("accepts a valid ACTIVE product", () => {
    expect(validateProduct(validProduct)).toEqual([]);
    expect(validateProductWithZod(validProduct)).toEqual({
      isValid: true,
      errors: [],
    });
  });

  it("requires pricingTemplateId for ACTIVE products", () => {
    const errors = validateProduct({
      ...validProduct,
      pricingTemplateId: undefined,
    });
    expect(errors).toEqual(["Szablon cenowy jest wymagany dla aktywnych produktów"]);
  });

  it("rejects select inputs without any options", () => {
    const errors = validateProduct({
      ...validProduct,
      inputsBySubvariant: {
        main: [{ type: "COLOR", values: [] }],
      },
    });
    expect(errors[0]).toContain("wymaga co najmniej jednej opcji");
  });

  it("rejects unsupported input types", () => {
    const errors = validateProduct({
      ...validProduct,
      inputsBySubvariant: {
        main: [{ type: "UNKNOWN_FIELD" }],
      },
    });
    expect(errors).toEqual(["Nieobsługiwany parametr: UNKNOWN_FIELD"]);
  });

  it("fails Zod validation when inputs are missing", () => {
    const result = validateProductWithZod({
      category: "KATEGORIA_A",
      variant: "Brak inputów",
      status: "TEST",
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Parametry produktu są wymagane");
  });
});
