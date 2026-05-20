import { useCallback, useEffect } from "react";
import { PRODUCT_INPUT_TYPES } from "@/app/contexts/inputTypes";

interface UseProductInitializationProps {
  initialProduct: any;
  isAddMode: boolean;
  form: any;
  defaultInputState: any;
  parametersBySubvariant: any;
  setParametersBySubvariant: (params: any) => void;
  setHasSubvariants: (value: boolean) => void;
  setSubvariants: (value: string[]) => void;
  selectedSubvariant: string;
  setSelectedSubvariant: (value: string) => void;
  setSubvariantInputsSeparate: (value: boolean) => void;
  setInitialValues: (values: any) => void;
  setStateReady: (value: boolean) => void;
  setExpandedParams: (params: any) => void;
  expandedParams: any;
  hasSubvariants: boolean;
  subvariants: string[];
  newColorValue: string;
  setNewColorValue: (value: string) => void;
  newMaterialValue: string;
  setNewMaterialValue: (value: string) => void;
  stateReady: boolean;
}

export function useProductInitialization({
  initialProduct,
  isAddMode,
  form,
  defaultInputState,
  parametersBySubvariant,
  setParametersBySubvariant,
  setHasSubvariants,
  setSubvariants,
  selectedSubvariant,
  setSelectedSubvariant,
  setSubvariantInputsSeparate,
  setInitialValues,
  setStateReady,
  setExpandedParams,
  expandedParams,
  hasSubvariants,
  subvariants,
  newColorValue,
  setNewColorValue,
  newMaterialValue,
  setNewMaterialValue,
  stateReady,
}: UseProductInitializationProps) {
  const getSubKey = () => {
    if (initialProduct?.subvariants && initialProduct.subvariants.length > 0) {
      const hasIndividualParams = initialProduct.inputsBySubvariant
        ? Object.keys(initialProduct.inputsBySubvariant).length > 1 ||
          !initialProduct.inputsBySubvariant.main
        : (initialProduct.inputs &&
            Object.keys(initialProduct.inputs).length > 1) ||
          !initialProduct.inputs.main;

      if (hasIndividualParams) {
        return selectedSubvariant || initialProduct.subvariants[0];
      }
    }

    if (hasSubvariants && subvariants.length > 0) {
      return selectedSubvariant;
    }
    return "main";
  };

  useEffect(() => {
    if (!isAddMode && initialProduct && !stateReady) {
      form.setValue("category", initialProduct.category);
      form.setValue("variant", initialProduct.variant);
      form.setValue("status", initialProduct.status);
      if (initialProduct.pricingTemplate?.id) {
        form.setValue("pricingTemplate", initialProduct.pricingTemplate.id);
      }

      if (initialProduct.subvariants && initialProduct.subvariants.length > 0) {
        setHasSubvariants(true);
        setSubvariants(initialProduct.subvariants);
        setSelectedSubvariant(initialProduct.subvariants[0]);

        let obj: any = {};
        let hasIndividualParams = false;

        if (initialProduct.inputsBySubvariant) {
          hasIndividualParams =
            Object.keys(initialProduct.inputsBySubvariant).length > 1 ||
            !initialProduct.inputsBySubvariant.main;

          Object.entries(initialProduct.inputsBySubvariant).forEach(
            ([sub, arr]: [string, any]) => {
              const paramObj: any = {
                inputs: {},
                defaultsEnabled: {},
                defaults: {},
                inputValues: {},
                accessories: [],
                newAccessoryName: "",
                newAccessoryQty: 1,
                required: {},
              };
              if (Array.isArray(arr)) {
                arr.forEach((input: any) => {
                  paramObj.inputs[input.type] = true;
                  if (input.default !== undefined) {
                    paramObj.defaultsEnabled[input.type] = true;
                    paramObj.defaults[input.type] = input.default;
                  } else {
                    paramObj.defaultsEnabled[input.type] = false;
                    paramObj.defaults[input.type] = "";
                  }
                  const config = PRODUCT_INPUT_TYPES.find(
                    (t) => t.id === input.type
                  );
                  if (
                    input.values &&
                    Array.isArray(input.values) &&
                    config?.hasValues
                  ) {
                    paramObj.inputValues[input.type] = input.values;
                  }
                  paramObj.required[input.type] = input.required ?? false;
                  if (input.type === "HANDLE") {
                    paramObj.handleCustomEnabled =
                      input.values && input.values.includes("__custom__");
                  }
                });
              }

              obj[sub] = paramObj;
            }
          );
        } else if (
          initialProduct.inputs &&
          typeof initialProduct.inputs === "object"
        ) {
          hasIndividualParams =
            Object.keys(initialProduct.inputs).length > 1 ||
            !initialProduct.inputs.main;

          Object.entries(initialProduct.inputs).forEach(
            ([sub, arr]: [string, any]) => {
              const paramObj: any = {
                inputs: {},
                defaultsEnabled: {},
                defaults: {},
                inputValues: {},
                accessories: [],
                newAccessoryName: "",
                newAccessoryQty: 1,
                required: {},
              };
              if (Array.isArray(arr)) {
                arr.forEach((input: any) => {
                  paramObj.inputs[input.type] = true;
                  if (input.default !== undefined) {
                    paramObj.defaultsEnabled[input.type] = true;
                    paramObj.defaults[input.type] = input.default;
                  } else {
                    paramObj.defaultsEnabled[input.type] = false;
                    paramObj.defaults[input.type] = "";
                  }
                  const config = PRODUCT_INPUT_TYPES.find(
                    (t) => t.id === input.type
                  );
                  if (
                    input.values &&
                    Array.isArray(input.values) &&
                    config?.hasValues
                  ) {
                    paramObj.inputValues[input.type] = input.values;
                  }
                  paramObj.required[input.type] = input.required ?? false;

                  if (input.type === "HANDLE") {
                    paramObj.handleCustomEnabled =
                      input.values && input.values.includes("__custom__");
                  }
                });
              }

              obj[sub] = paramObj;
            }
          );
        }

        setSubvariantInputsSeparate(hasIndividualParams);
        setParametersBySubvariant(obj);

        if (obj[initialProduct.subvariants[0]]) {
          const firstSubvariant = obj[initialProduct.subvariants[0]];
          form.setValue("inputs", firstSubvariant.inputs);
          form.setValue("defaultsEnabled", firstSubvariant.defaultsEnabled);
          form.setValue("defaults", firstSubvariant.defaults);
          form.setValue("inputValues", firstSubvariant.inputValues);
        }
      } else {
        setHasSubvariants(false);
        setSubvariants([]);
        setSubvariantInputsSeparate(false);
        setSelectedSubvariant("main");

        let mainInputsArr = null;
        if (initialProduct.inputs) {
          if (Array.isArray(initialProduct.inputs)) {
            mainInputsArr = initialProduct.inputs;
          } else if (
            typeof initialProduct.inputs === "object" &&
            Array.isArray(initialProduct.inputs.main)
          ) {
            mainInputsArr = initialProduct.inputs.main;
          }
        }
        if (mainInputsArr) {
          const paramObj: any = {
            inputs: {},
            defaultsEnabled: {},
            defaults: {},
            inputValues: {},
            accessories: [],
            newAccessoryName: "",
            newAccessoryQty: 1,
            required: {},
          };

          mainInputsArr.forEach((input: any) => {
            paramObj.inputs[input.type] = true;
            if (input.default !== undefined) {
              paramObj.defaultsEnabled[input.type] = true;
              paramObj.defaults[input.type] = input.default;
            } else {
              paramObj.defaultsEnabled[input.type] = false;
              paramObj.defaults[input.type] = "";
            }
            const config = PRODUCT_INPUT_TYPES.find((t) => t.id === input.type);
            if (
              input.values &&
              Array.isArray(input.values) &&
              config?.hasValues
            ) {
              paramObj.inputValues[input.type] = input.values;
            }
            paramObj.required[input.type] = input.required ?? false;
          });

          const requiredFields = ["COLOR", "MATERIAL"];
          requiredFields.forEach((field) => {
            if (!(field in paramObj.inputs)) {
              paramObj.inputs[field] = false;
            }
          });
          if (!paramObj.required) paramObj.required = {};
          if (paramObj.required.WIDTH === undefined) {
            paramObj.required.WIDTH = true;
          }
          if (paramObj.required.HEIGHT === undefined) {
            paramObj.required.HEIGHT = true;
          }

          setParametersBySubvariant({ main: paramObj });

          form.setValue("inputs", paramObj.inputs);
          form.setValue("defaultsEnabled", paramObj.defaultsEnabled);
          form.setValue("defaults", paramObj.defaults);
          form.setValue("inputValues", paramObj.inputValues);
        }
      }

      const initialFormValues = {
        category: initialProduct.category,
        variant: initialProduct.variant,
        status: initialProduct.status,
        pricingTemplate: initialProduct.pricingTemplate?.id || "",
        inputs: parametersBySubvariant[getSubKey()]?.inputs || {},
        defaultsEnabled:
          parametersBySubvariant[getSubKey()]?.defaultsEnabled || {},
        defaults: parametersBySubvariant[getSubKey()]?.defaults || {},
        inputValues: parametersBySubvariant[getSubKey()]?.inputValues || {},
        subvariants: initialProduct.subvariants || [],
        hasSubvariants:
          initialProduct.subvariants && initialProduct.subvariants.length > 0,
        subvariantInputsSeparate:
          initialProduct.subvariants && initialProduct.subvariants.length > 0,
        parametersBySubvariant: parametersBySubvariant,
      };
      setInitialValues(initialFormValues);
      setStateReady(true);
    } else if (isAddMode && !stateReady) {
      const addModeInitialValues = {
        category: undefined,
        variant: "",
        status: "INACTIVE",
        pricingTemplate: "",
        inputs: {},
        defaultsEnabled: {},
        defaults: {},
        inputValues: {},
        subvariants: [],
        hasSubvariants: false,
        subvariantInputsSeparate: false,
        parametersBySubvariant: {
          main: {
            inputs: {},
            defaultsEnabled: {},
            defaults: {},
            inputValues: {},
            accessories: [],
            newAccessoryName: "",
            newAccessoryQty: 1,
            required: {},
          },
        },
      };
      setInitialValues(addModeInitialValues);
      setStateReady(true);
    }
  }, [
    initialProduct,
    isAddMode,
    form,
    defaultInputState,
    getSubKey,
    setHasSubvariants,
    setSubvariants,
    setSelectedSubvariant,
    setSubvariantInputsSeparate,
    setParametersBySubvariant,
    setInitialValues,
    setStateReady,
  ]);

  useEffect(() => {
    if (hasSubvariants) {
      setParametersBySubvariant((prevParams: any) => {
        const newParams = { ...prevParams };
        subvariants.forEach((sv) => {
          if (!newParams[sv]) {
            let mainCopy: any = {};
            try {
              if (newParams.main && Object.keys(newParams.main).length > 0) {
                mainCopy = JSON.parse(JSON.stringify(newParams.main));
              } else {
                mainCopy = {
                  inputs: {},
                  defaultsEnabled: {},
                  defaults: {},
                  inputValues: {},
                  accessories: [],
                  newAccessoryName: "",
                  newAccessoryQty: 1,
                  required: {},
                };
              }
              newParams[sv] = mainCopy;
            } catch (e) {
            }
          } else {
          }
        });
        return newParams;
      });

      setExpandedParams((prevExpanded: any) => {
        const newExpanded = { ...prevExpanded };
        subvariants.forEach((sv) => {
          if (!newExpanded[sv]) {
            newExpanded[sv] = {};
          }
        });
        return newExpanded;
      });
    }
  }, [subvariants, hasSubvariants, defaultInputState]);

  useEffect(() => {
    if (!stateReady) {
      return;
    }

    const subKey = getSubKey();
    const currentParams = parametersBySubvariant[subKey];

    if (currentParams) {
      form.setValue("inputs", currentParams.inputs);
      form.setValue("defaultsEnabled", currentParams.defaultsEnabled);
      form.setValue("defaults", currentParams.defaults);
      form.setValue("inputValues", currentParams.inputValues);
    }
  }, [
    selectedSubvariant,
    hasSubvariants,
    parametersBySubvariant,
    form,
    getSubKey,
    stateReady,
  ]);

  const updateCurrentParams = useCallback(
    (patch: Partial<any>) => {
      const subKey = getSubKey();
      setParametersBySubvariant((prev: any) => {
        const updated = {
          ...prev,
          [subKey]: {
            ...prev[subKey],
            ...patch,
          },
        };

        const currentParams = updated[subKey];
        if (currentParams) {
          form.setValue("inputs", currentParams.inputs);
          form.setValue("defaultsEnabled", currentParams.defaultsEnabled);
          form.setValue("defaults", currentParams.defaults);
          form.setValue("inputValues", currentParams.inputValues);
        }

        return updated;
      });
    },
    [getSubKey, setParametersBySubvariant, form]
  );

  const updateExpanded = useCallback(
    (field: string, value: boolean) => {
      const subKey = getSubKey();
      setExpandedParams((prev: any) => ({
        ...prev,
        [subKey]: {
          ...prev[subKey],
          [field]: value,
        },
      }));
    },
    [getSubKey, setExpandedParams]
  );

  const addColorValue = useCallback(() => {
    const subKey = getSubKey();
    const paramObj = parametersBySubvariant[subKey];
    const colorValues = paramObj.inputValues.COLOR || [];
    if (newColorValue.trim() && !colorValues.includes(newColorValue.trim())) {
      updateCurrentParams({
        inputValues: {
          ...paramObj.inputValues,
          COLOR: [...colorValues, newColorValue.trim()],
        },
      });
      setNewColorValue("");
    }
  }, [
    getSubKey,
    parametersBySubvariant,
    newColorValue,
    updateCurrentParams,
    setNewColorValue,
  ]);

  const removeColorValue = useCallback(
    (value: string) => {
      const subKey = getSubKey();
      const paramObj = parametersBySubvariant[subKey];
      const colorValues = paramObj.inputValues.COLOR || [];
      const updatedValues = colorValues.filter((v: string) => v !== value);
      updateCurrentParams({
        inputValues: {
          ...paramObj.inputValues,
          COLOR: updatedValues,
        },
      });
      if (form.getValues("defaults.COLOR") === value) {
        form.setValue("defaults.COLOR", updatedValues[0] || "");
      }
    },
    [getSubKey, parametersBySubvariant, updateCurrentParams, form]
  );

  const addMaterialValue = useCallback(() => {
    const subKey = getSubKey();
    const paramObj = parametersBySubvariant[subKey];
    const materialValues = paramObj.inputValues.MATERIAL || [];
    if (
      newMaterialValue.trim() &&
      !materialValues.includes(newMaterialValue.trim())
    ) {
      updateCurrentParams({
        inputValues: {
          ...paramObj.inputValues,
          MATERIAL: [...materialValues, newMaterialValue.trim()],
        },
      });
      setNewMaterialValue("");
    }
  }, [
    getSubKey,
    parametersBySubvariant,
    newMaterialValue,
    updateCurrentParams,
    setNewMaterialValue,
  ]);

  const removeMaterialValue = useCallback(
    (value: string) => {
      const subKey = getSubKey();
      const paramObj = parametersBySubvariant[subKey];
      const materialValues = paramObj.inputValues.MATERIAL || [];
      const updatedValues = materialValues.filter((v: string) => v !== value);
      updateCurrentParams({
        inputValues: {
          ...paramObj.inputValues,
          MATERIAL: updatedValues,
        },
      });
      if (form.getValues("defaults.MATERIAL") === value) {
        form.setValue("defaults.MATERIAL", updatedValues[0] || "");
      }
    },
    [getSubKey, parametersBySubvariant, updateCurrentParams, form]
  );

  const handleSubvariantsToggle = useCallback(
    (enabled: boolean) => {
      if (enabled) {
      } else {
        setSubvariants([]);
        setSelectedSubvariant("main");
        setSubvariantInputsSeparate(false);

        setParametersBySubvariant((prev: any) => ({
          main: prev.main || {
            inputs: {},
            defaultsEnabled: {},
            defaults: {},
            inputValues: {},
            accessories: [],
            newAccessoryName: "",
            newAccessoryQty: 1,
            required: {},
          },
        }));
      }
    },
    [
      isAddMode,
      subvariants.length,
      setSubvariants,
      setSelectedSubvariant,
      setSubvariantInputsSeparate,
      setParametersBySubvariant,
      defaultInputState,
    ]
  );

  return {
    updateCurrentParams,
    updateExpanded,
    addColorValue,
    removeColorValue,
    addMaterialValue,
    removeMaterialValue,
    handleSubvariantsToggle,
  };
}
