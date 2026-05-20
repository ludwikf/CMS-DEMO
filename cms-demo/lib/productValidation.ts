import { z } from "zod";
import {
  PRODUCT_INPUT_TYPES,
  getInputConfigById,
} from "@/app/contexts/inputTypes";
import { PRODUCT_CATEGORY_KEYS } from "@/lib/productCategories";

export const validateProductData = (productData: any) => {
  const errors: string[] = [];
  if (!productData.category) errors.push("Kategoria jest wymagana");
  if (!productData.variant?.trim()) errors.push("Nazwa produktu jest wymagana");
  if (!productData.status) errors.push("Status jest wymagany");
  if (productData.status === "ACTIVE" && !productData.pricingTemplateId) {
    errors.push("Szablon cenowy jest wymagany dla aktywnych produktów");
  }
  return errors;
};

export const validateProductInputs = (inputs: any) => {
  const errors: string[] = [];
  if (!inputs || typeof inputs !== "object") {
    errors.push("Parametry produktu muszą być obiektem");
    return errors;
  }

  const main = inputs.main ?? inputs[Object.keys(inputs)[0]];
  if (!Array.isArray(main) || main.length === 0) {
    errors.push("Dodaj co najmniej jeden parametr produktu");
    return errors;
  }

  const validTypes = PRODUCT_INPUT_TYPES.map((t) => t.id);
  main.forEach((input: any, index: number) => {
    if (!input?.type) {
      errors.push(`Parametr ${index + 1}: brak typu`);
      return;
    }
    if (!validTypes.includes(input.type)) {
      errors.push(`Nieobsługiwany parametr: ${input.type}`);
      return;
    }
    const fieldConfig = getInputConfigById(input.type);
    if (
      fieldConfig?.hasValues &&
      (!Array.isArray(input.values) || input.values.length === 0)
    ) {
      errors.push(`${fieldConfig.label} wymaga co najmniej jednej opcji`);
    }
  });

  return errors;
};

export const validateSubvariantsConsistency = () => {
  return [] as string[];
};

export const validateProduct = (productData: any) => {
  const errors: string[] = [
    ...validateProductData(productData),
  ];
  const inputs = productData.inputs || productData.inputsBySubvariant;
  if (inputs) errors.push(...validateProductInputs(inputs));
  else errors.push("Parametry produktu są wymagane");
  return errors.length > 0 ? [errors[0]] : [];
};

export const validateDatabaseProduct = (productData: any) => {
  const errors = [...validateProductData(productData)];
  if (!productData.inputs || typeof productData.inputs !== "object") {
    errors.push("Parametry produktu są wymagane");
  }
  return errors;
};

export const ProductInputSchema = z.object({
  type: z.enum(PRODUCT_INPUT_TYPES.map((t) => t.id) as [string, ...string[]]),
  default: z.union([z.string(), z.number(), z.null()]).optional(),
  values: z.array(z.union([z.string(), z.any()])).optional(),
  required: z.boolean().optional(),
});

export const ProductInputsSchema = z.record(z.string(), z.array(ProductInputSchema));

export const ProductSchema = z.object({
  category: z.enum(PRODUCT_CATEGORY_KEYS),
  variant: z.string().min(1, "Nazwa produktu jest wymagana"),
  status: z.enum(["ACTIVE", "INACTIVE", "TEST"]),
  pricingTemplateId: z.string().optional(),
  inputs: ProductInputsSchema.optional(),
  inputsBySubvariant: ProductInputsSchema.optional(),
  subvariants: z.array(z.string()).optional(),
});

export const validateProductWithZod = (productData: any) => {
  try {
    if (!productData.inputs && !productData.inputsBySubvariant) {
      return {
        isValid: false,
        errors: ["Parametry produktu są wymagane"],
      };
    }
    ProductSchema.parse(productData);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map((e) => e.message),
      };
    }
    return { isValid: false, errors: ["Błąd walidacji"] };
  }
};
