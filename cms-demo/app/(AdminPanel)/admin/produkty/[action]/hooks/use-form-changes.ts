import { useCallback } from "react";

interface UseFormChangesProps {
  initialValues: any;
  isAddMode: boolean;
  form: any;
  parametersBySubvariant: any;
  getSubKey: () => string;
  subvariants: string[];
  hasSubvariants: boolean;
  subvariantInputsSeparate: boolean;
}

export function useFormChanges({
  initialValues,
  isAddMode,
  form,
  parametersBySubvariant,
  getSubKey,
  subvariants,
  hasSubvariants,
  subvariantInputsSeparate,
}: UseFormChangesProps) {
  const deepEqual = useCallback((obj1: any, obj2: any): boolean => {
    if (obj1 === obj2) return true;
    if (obj1 == null || obj2 == null) return false;
    if (typeof obj1 !== typeof obj2) return false;

    if (typeof obj1 !== "object") return obj1 === obj2;

    if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;

    if (Array.isArray(obj1)) {
      if (obj1.length !== obj2.length) return false;
      for (let i = 0; i < obj1.length; i++) {
        if (!deepEqual(obj1[i], obj2[i])) return false;
      }
      return true;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (!keys2.includes(key)) return false;
      if (!deepEqual(obj1[key], obj2[key])) return false;
    }

    return true;
  }, []);

  const hasFormChanges = useCallback(() => {
    if (!initialValues || isAddMode) return true;

    const currentValues = {
      category: form.getValues("category"),
      variant: form.getValues("variant"),
      status: form.getValues("status"),
      pricingTemplate: form.getValues("pricingTemplate") || "",
      inputs: parametersBySubvariant[getSubKey()]?.inputs || {},
      defaultsEnabled:
        parametersBySubvariant[getSubKey()]?.defaultsEnabled || {},
      defaults: parametersBySubvariant[getSubKey()]?.defaults || {},
      inputValues: parametersBySubvariant[getSubKey()]?.inputValues || {},
      subvariants: subvariants,
      hasSubvariants: hasSubvariants,
      subvariantInputsSeparate: subvariantInputsSeparate,
      parametersBySubvariant: parametersBySubvariant,
    };

    return !deepEqual(currentValues, initialValues);
  }, [
    initialValues,
    isAddMode,
    form,
    parametersBySubvariant,
    getSubKey,
    subvariants,
    hasSubvariants,
    subvariantInputsSeparate,
    deepEqual,
  ]);

  return {
    hasFormChanges,
    deepEqual,
  };
}
