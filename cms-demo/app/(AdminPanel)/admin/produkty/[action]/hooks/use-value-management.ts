import { useState, useCallback } from "react";
import { PRODUCT_INPUT_TYPES } from "@/app/contexts/inputTypes";

interface UseValueManagementProps {
  parametersBySubvariant: Record<string, any>;
  updateCurrentParams: (updates: any) => void;
  getSubKey: () => string;
  form: any;
}

export const useValueManagement = ({
  parametersBySubvariant,
  updateCurrentParams,
  getSubKey,
  form,
}: UseValueManagementProps) => {
  const [newValueInputs, setNewValueInputs] = useState<Record<string, any>>({});

  const handleNewValueInputChange = useCallback(
    (fieldId: string, value: any) => {
      setNewValueInputs((prev) => ({ ...prev, [fieldId]: value }));
    },
    []
  );

  const handleAddValue = useCallback(
    (field: (typeof PRODUCT_INPUT_TYPES)[number]) => {
      const subKey = getSubKey();
      const paramObj = parametersBySubvariant[subKey];
      const values = paramObj.inputValues[field.id] || [];
      let newValue = newValueInputs[field.id];

      if (field.type === "number") {
        newValue = Number(newValue);
        if (isNaN(newValue)) return;
      }

      if (field.id === "ACCESSORIES") {
        if (!newValue?.name || !newValue?.quantity) return;
        if (values.some((v: any) => v.name === newValue.name)) return;

        updateCurrentParams({
          inputValues: {
            ...paramObj.inputValues,
            [field.id]: [
              ...values,
              { name: newValue.name, quantity: Number(newValue.quantity) },
            ],
          },
        });

        setNewValueInputs((prev) => ({
          ...prev,
          [field.id]: { name: "", quantity: "" },
        }));
        return;
      }

      if (newValue && !values.includes(newValue)) {
        updateCurrentParams({
          inputValues: {
            ...paramObj.inputValues,
            [field.id]: [...values, newValue],
          },
        });

        setNewValueInputs((prev) => ({
          ...prev,
          [field.id]: field.type === "number" ? "" : "",
        }));
      }
    },
    [getSubKey, parametersBySubvariant, newValueInputs, updateCurrentParams]
  );

  const handleRemoveValue = useCallback(
    (field: (typeof PRODUCT_INPUT_TYPES)[number], value: any) => {
      const subKey = getSubKey();
      const paramObj = parametersBySubvariant[subKey];
      const values = paramObj.inputValues[field.id] || [];

      let filteredValues;
      if (field.id === "SYSTEM_COLOR") {
        filteredValues = values.filter(
          (v: any) => !(v.finish === value.finish && v.color === value.color)
        );
      } else if (field.id === "ACCESSORIES") {
        filteredValues = values.filter((v: any) => v.name !== value.name);
      } else {
        filteredValues = values.filter((v: any) => v !== value);
      }

      updateCurrentParams({
        inputValues: {
          ...paramObj.inputValues,
          [field.id]: filteredValues,
        },
      });

      if (
        form.getValues(`defaults.${field.id}`) === value ||
        (field.id === "ACCESSORIES" &&
          form.getValues(`defaults.${field.id}`)?.name === value.name)
      ) {
        form.setValue(
          `defaults.${field.id}`,
          filteredValues.length > 1 ? filteredValues[0] : ""
        );
      }
    },
    [getSubKey, parametersBySubvariant, updateCurrentParams, form]
  );

  const addGuideValue = useCallback(
    (newGuideValue: string, setNewGuideValue: (value: string) => void) => {
      const subKey = getSubKey();
      const paramObj = parametersBySubvariant[subKey];
      const guideValues = paramObj.inputValues.GUIDE || [];

      if (newGuideValue.trim() && !guideValues.includes(newGuideValue.trim())) {
        updateCurrentParams({
          inputValues: {
            ...paramObj.inputValues,
            GUIDE: [...guideValues, newGuideValue.trim()],
          },
        });
        setNewGuideValue("");
      }
    },
    [getSubKey, parametersBySubvariant, updateCurrentParams]
  );

  const removeGuideValue = useCallback(
    (value: string) => {
      const subKey = getSubKey();
      const paramObj = parametersBySubvariant[subKey];
      const guideValues = paramObj.inputValues.GUIDE || [];
      const updatedValues = guideValues.filter((v: string) => v !== value);

      updateCurrentParams({
        inputValues: {
          ...paramObj.inputValues,
          GUIDE: updatedValues,
        },
      });

      if (form.getValues("defaults.GUIDE") === value) {
        form.setValue("defaults.GUIDE", updatedValues[0] || "");
      }
    },
    [getSubKey, parametersBySubvariant, updateCurrentParams, form]
  );

  const addMountingTypeValue = useCallback(
    (
      newMountingTypeValue: string,
      setNewMountingTypeValue: (value: string) => void
    ) => {
      const subKey = getSubKey();
      const paramObj = parametersBySubvariant[subKey];
      const mountingTypeValues = paramObj.inputValues.MOUNTING_TYPE || [
        "Standardowy",
      ];

      if (
        newMountingTypeValue.trim() &&
        !mountingTypeValues.includes(newMountingTypeValue.trim())
      ) {
        updateCurrentParams({
          inputValues: {
            ...paramObj.inputValues,
            MOUNTING_TYPE: [...mountingTypeValues, newMountingTypeValue.trim()],
          },
        });
        form.setValue("defaults.MOUNTING_TYPE", "Standardowy");
        setNewMountingTypeValue("");
      }
    },
    [getSubKey, parametersBySubvariant, updateCurrentParams, form]
  );

  const removeMountingTypeValue = useCallback(
    (value: string) => {
      const subKey = getSubKey();
      const paramObj = parametersBySubvariant[subKey];
      const mountingTypeValues = paramObj.inputValues.MOUNTING_TYPE || [
        "Standardowy",
      ];
      const updatedValues = mountingTypeValues.filter(
        (v: string) => v !== value
      );

      updateCurrentParams({
        inputValues: {
          ...paramObj.inputValues,
          MOUNTING_TYPE: updatedValues,
        },
      });

      if (form.getValues("defaults.MOUNTING_TYPE") === value) {
        form.setValue("defaults.MOUNTING_TYPE", updatedValues[0] || "");
      }
    },
    [getSubKey, parametersBySubvariant, updateCurrentParams, form]
  );

  const addHandleValue = useCallback(
    (newHandleValue: string, setNewHandleValue: (value: string) => void) => {
      const subKey = getSubKey();
      const paramObj = parametersBySubvariant[subKey];
      const handleValues = paramObj.inputValues.HANDLE || [];
      const val = newHandleValue.trim();

      if (val && !handleValues.includes(val)) {
        updateCurrentParams({
          inputValues: {
            ...paramObj.inputValues,
            HANDLE: [...handleValues, val],
          },
        });
        setNewHandleValue("");
      }
    },
    [getSubKey, parametersBySubvariant, updateCurrentParams]
  );

  const removeHandleValue = useCallback(
    (value: string) => {
      const subKey = getSubKey();
      const paramObj = parametersBySubvariant[subKey];
      const handleValues = paramObj.inputValues.HANDLE || [];
      const updatedValues = handleValues.filter((v: string) => v !== value);

      updateCurrentParams({
        inputValues: {
          ...paramObj.inputValues,
          HANDLE: updatedValues,
        },
      });

      if (form.getValues("defaults.HANDLE") === value) {
        form.setValue("defaults.HANDLE", updatedValues[0] || "");
      }
    },
    [getSubKey, parametersBySubvariant, updateCurrentParams, form]
  );

  return {
    newValueInputs,
    handleNewValueInputChange,
    handleAddValue,
    handleRemoveValue,
    addGuideValue,
    removeGuideValue,
    addMountingTypeValue,
    removeMountingTypeValue,
    addHandleValue,
    removeHandleValue,
  };
};
