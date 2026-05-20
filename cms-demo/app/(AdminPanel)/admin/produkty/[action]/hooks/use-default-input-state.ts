import { useMemo } from "react";
import { PRODUCT_INPUT_TYPES } from "@/app/contexts/inputTypes";

export function useDefaultInputState() {
  return useMemo(() => {
    const inputs: Record<string, boolean> = {};
    const defaultsEnabled: Record<string, boolean> = {};
    const defaults: Record<string, string | number> = {};
    const inputValues: Record<string, any[]> = {};
    const required: Record<string, boolean> = {};

    PRODUCT_INPUT_TYPES.forEach((input) => {
      inputs[input.id] = !!input.enabledByDefault;
      defaultsEnabled[input.id] = false;
      if (input.type === "number") {
        defaults[input.id] = "";
      } else {
        defaults[input.id] = "";
      }
      if (input.hasValues) {
        inputValues[input.id] =
          input.id === "COLOR"
            ? ["Standard", "Premium"]
            : input.id === "MODEL"
            ? ["Podstawowy"]
            : [];
      }
      required[input.id] = !!input.hasRequired;
    });

    return {
      inputs,
      defaultsEnabled,
      defaults,
      inputValues,
      required,
    };
  }, []);
}
