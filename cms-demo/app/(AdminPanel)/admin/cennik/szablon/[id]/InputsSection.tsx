import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, ChevronDown, ChevronRight } from "lucide-react";
import { Copy } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import {
  PRODUCT_INPUT_TYPES,
  ProductInputConfig,
} from "@/app/contexts/inputTypes";

interface InputsSectionProps {
  tableType: string;
  inputs: any[];
  setInputs: (inputs: any[]) => void;
  sectionKey?: string;
  forceExpand?: string[];
  subvariants?: string[];
  pricingSections?: { [key: string]: any[] };
  copyInputsFromSubvariant?: (source: string, target: string) => void;
  selectedMap: { [key: string]: string[] };
  setSelectedMap: React.Dispatch<
    React.SetStateAction<{ [key: string]: string[] }>
  >;
  expandedMap: { [key: string]: string[] };
  setExpandedMap: React.Dispatch<
    React.SetStateAction<{ [key: string]: string[] }>
  >;
  visibleFields: string[];
  setVisibleFields: (fields: string[]) => void;
}

export default function InputsSection({
  tableType = "regular",
  inputs,
  setInputs,
  sectionKey,
  forceExpand,
  subvariants,
  pricingSections,
  copyInputsFromSubvariant,
  selectedMap,
  setSelectedMap,
  expandedMap,
  setExpandedMap,
  visibleFields,
  setVisibleFields,
}: InputsSectionProps) {
  const selected = selectedMap[sectionKey || "default"] || [];
  const expanded = expandedMap[sectionKey || "default"] || [];

  const setSelected = (val: string[]) => {
    setSelectedMap((prev) => ({
      ...prev,
      [sectionKey || "default"]: val,
    }));
  };
  const setExpanded = (val: string[]) => {
    setExpandedMap((prev) => ({
      ...prev,
      [sectionKey || "default"]: val,
    }));
  };

  useEffect(() => {
    if (forceExpand && Array.isArray(forceExpand)) {
      setExpanded(forceExpand);
    }
    // eslint-disable-next-line
  }, [JSON.stringify(forceExpand), sectionKey]);

  useEffect(() => {
    const fieldsWithValues = PRODUCT_INPUT_TYPES.map(
      (field) => field.id
    ).filter((id) => inputs.some((i) => i.type === id));
    const current = expandedMap[sectionKey || "default"] || [];
    const newExpanded = Array.from(new Set([...current, ...fieldsWithValues]));
    if (newExpanded.length !== current.length) {
      setExpanded(newExpanded);
    }
    const currentSelected = selectedMap[sectionKey || "default"] || [];
    const newSelected = Array.from(
      new Set([...currentSelected, ...fieldsWithValues])
    );
    if (newSelected.length !== currentSelected.length) {
      setSelected(newSelected);
    }
    // eslint-disable-next-line
  }, [inputs, sectionKey]);

  useEffect(() => {
    const fieldsWithValues = PRODUCT_INPUT_TYPES.map(
      (field) => field.id
    ).filter((id) => inputs.some((i) => i.type === id));
    setVisibleFields(
      Array.from(new Set([...visibleFields, ...fieldsWithValues]))
    );
    // eslint-disable-next-line
  }, [inputs]);

  const inputFields: ProductInputConfig[] = PRODUCT_INPUT_TYPES.filter(
    (field) =>
      (field.id !== "COLOR" && field.id !== "QUANTITY") || tableType !== "color"
  );

  const comboboxOptions = inputFields
    .filter((field) => !visibleFields.includes(field.id))
    .map((field) => ({ value: field.id, label: field.label }));

  const [newHandleValue, setNewHandleValue] = useState("");
  const [newHandlePrice, setNewHandlePrice] = useState("");

  const [newAccessoryName, setNewAccessoryName] = useState("");
  const [newAccessoryPrice, setNewAccessoryPrice] = useState("");

  const [newMountingTypeName, setNewMountingTypeName] = useState("");
  const [newMountingTypePrice, setNewMountingTypePrice] = useState("");

  const [newGuideColor, setNewGuideColor] = useState("");
  const [newGuidePrice, setNewGuidePrice] = useState("");

  const [newMaterialName, setNewMaterialName] = useState("");
  const [newMaterialPrice, setNewMaterialPrice] = useState("");

  const [copyFromMap, setCopyFromMap] = useState<{ [key: string]: string }>({});
  const copyFrom = copyFromMap[sectionKey || "default"] || "";

  const [decInputs, setDecInputs] = useState<{ [key: string]: string }>({});

  const [newValues, setNewValues] = useState<{ [key: string]: string }>({});
  const [newPrices, setNewPrices] = useState<{ [key: string]: string }>({});

  const addHandlePair = () => {
    if (!newHandleValue.trim() || !newHandlePrice.trim()) return;
    setInputs([
      ...inputs,
      { type: "handle", value: newHandleValue, price: newHandlePrice },
    ]);
    setNewHandleValue("");
    setNewHandlePrice("");
  };

  const removeHandlePair = (value: string) => {
    setInputs(inputs.filter((i) => i.type !== "handle" || i.value !== value));
  };

  const addAccessoryPair = () => {
    if (!newAccessoryName.trim() || !newAccessoryPrice.trim()) return;
    setInputs([
      ...inputs,
      { type: "accessory", value: newAccessoryName, price: newAccessoryPrice },
    ]);
    setNewAccessoryName("");
    setNewAccessoryPrice("");
  };

  const removeAccessoryPair = (value: string) => {
    setInputs(
      inputs.filter((i) => i.type !== "accessory" || i.value !== value)
    );
  };

  const addMountingTypePair = () => {
    if (!newMountingTypeName.trim() || !newMountingTypePrice.trim()) return;
    setInputs([
      ...inputs,
      {
        type: "mountingType",
        value: newMountingTypeName,
        price: newMountingTypePrice,
      },
    ]);
    setNewMountingTypeName("");
    setNewMountingTypePrice("");
  };

  const removeMountingTypePair = (value: string) => {
    setInputs(
      inputs.filter((i) => i.type !== "mountingType" || i.value !== value)
    );
  };

  const addGuidePair = () => {
    if (!newGuideColor.trim() || !newGuidePrice.trim()) return;
    setInputs([
      ...inputs,
      { type: "guide", value: newGuideColor, price: newGuidePrice },
    ]);
    setNewGuideColor("");
    setNewGuidePrice("");
  };

  const removeGuidePair = (value: string) => {
    setInputs(inputs.filter((i) => i.type !== "guide" || i.value !== value));
  };

  const addMaterialPair = () => {
    if (!newMaterialName.trim() || !newMaterialPrice.trim()) return;
    setInputs([
      ...inputs,
      { type: "material", value: newMaterialName, price: newMaterialPrice },
    ]);
    setNewMaterialName("");
    setNewMaterialPrice("");
  };

  const removeMaterialPair = (value: string) => {
    setInputs(inputs.filter((i) => i.type !== "material" || i.value !== value));
  };

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-2">Parametry produktu</h3>
      <p className="text-sm text-gray-400 mb-4">
        Wybierz parametry, aby skonfigurować ceny dla tego produktu.
      </p>

      {comboboxOptions.length > 0 && (
        <div className="mb-4 max-w-xs">
          <Combobox
            value={undefined}
            setValue={(val) => {
              setVisibleFields([...visibleFields, val]);
            }}
            options={comboboxOptions}
            placeholder="Dodaj parametr..."
            variant="outline"
          />
        </div>
      )}
      {sectionKey &&
        subvariants &&
        subvariants.length > 1 &&
        copyInputsFromSubvariant && (
          <div className="mb-4 flex items-center gap-2">
            <label className="text-sm font-medium">Skopiuj z parametrów:</label>
            <Select
              value={copyFrom}
              onValueChange={(val) => {
                setCopyFromMap((prev) => ({
                  ...prev,
                  [sectionKey || "default"]: val,
                }));
                if (val && val !== sectionKey) {
                  copyInputsFromSubvariant(val, sectionKey);
                  setTimeout(() => {
                    setCopyFromMap((prev) => ({
                      ...prev,
                      [sectionKey || "default"]: "",
                    }));
                  }, 0);
                }
              }}
            >
              <SelectTrigger className="w-auto">
                <Copy className="w-4 h-4 mr-2 text-mainTheme" />
              </SelectTrigger>
              <SelectContent>
                {subvariants
                  .filter((sv) => sv !== sectionKey)
                  .map((sv) => (
                    <SelectItem key={sv} value={sv}>
                      {sv}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}
      <div className="flex flex-col gap-2">
        {inputFields
          .filter((field) => visibleFields.includes(field.id))
          .map((field) => {
            const isExpanded = expanded.includes(field.id);
            if (!field.hasValues) return null;

            const value = newValues[field.id] || "";
            const price = newPrices[field.id] || "";

            const addPair = () => {
              if (!value.trim() || !price.trim()) return;
              setInputs([
                ...inputs,
                {
                  type: field.id,
                  value: value,
                  price: price,
                },
              ]);
              setNewValues((prev) => ({ ...prev, [field.id]: "" }));
              setNewPrices((prev) => ({ ...prev, [field.id]: "" }));
            };

            const removePair = (val: string) => {
              setInputs(
                inputs.filter((i) => i.type !== field.id || i.value !== val)
              );
            };

            const pairs = inputs.filter((i) => i.type === field.id);

            return (
              <div key={field.id} className="relative">
                <div
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      setExpanded(
                        expanded.includes(field.id)
                          ? expanded.filter((id) => id !== field.id)
                          : [...expanded, field.id]
                      );
                      e.preventDefault();
                    }
                  }}
                  onClick={() => {
                    setExpanded(
                      expanded.includes(field.id)
                        ? expanded.filter((id) => id !== field.id)
                        : [...expanded, field.id]
                    );
                  }}
                  className={`flex flex-row items-center justify-between rounded-t-lg rounded-b-lg border border-[#bbb] px-4 py-3 cursor-pointer select-none transition-colors dark:text-white
                  ${
                    isExpanded
                      ? "bg-mainTheme border-mainTheme text-white"
                      : "bg-white dark:bg-[#222] dark:text-white dark:border-[#333]"
                  }
                    ${isExpanded ? "rounded-b-none" : ""}
                `}
                >
                  <div className="flex items-center gap-2 flex-1">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-white" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                    <span className="text-base m-0 cursor-pointer">
                      {field.label}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-red-500 bg-white dark:bg-[#232323] rounded-full p-1 shadow flex items-center justify-center ml-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setVisibleFields(
                        visibleFields.filter((id) => id !== field.id)
                      );
                      setInputs(inputs.filter((i) => i.type !== field.id));
                      setSelectedMap((prev) => ({
                        ...prev,
                        [sectionKey || "default"]: (
                          prev[sectionKey || "default"] || []
                        ).filter((id) => id !== field.id),
                      }));
                      setExpandedMap((prev) => ({
                        ...prev,
                        [sectionKey || "default"]: (
                          prev[sectionKey || "default"] || []
                        ).filter((id) => id !== field.id),
                      }));
                    }}
                    aria-label={`Ukryj sekcję ${field.label}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {isExpanded && (
                  <div className="rounded-b-lg border border-t-0 border-mainTheme bg-mainTheme/5 dark:bg-[#232323] px-4 py-4">
                    <div className="flex gap-2 mb-4">
                      <Input
                        placeholder={
                          field.label +
                          (field.type === "number" ? " (liczba)" : "")
                        }
                        type={field.type === "number" ? "number" : "text"}
                        value={value}
                        onChange={(e) =>
                          setNewValues((prev) => ({
                            ...prev,
                            [field.id]: e.target.value,
                          }))
                        }
                        className="w-[40%]"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            addPair();
                          }
                        }}
                      />
                      <Input
                        placeholder="Cena"
                        type="text"
                        inputMode="decimal"
                        value={price}
                        onChange={(e) => {
                          let val = e.target.value.replace(/,/g, ".");
                          if (/^\d*(\.|,)?\d*$/.test(e.target.value)) {
                            setNewPrices((prev) => ({
                              ...prev,
                              [field.id]: val,
                            }));
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            addPair();
                          }
                        }}
                        className="w-[100px]"
                      />
                      <Button
                        type="button"
                        className="h-full select-none"
                        onClick={addPair}
                        disabled={!value.trim() || !price.trim()}
                      >
                        Dodaj
                      </Button>
                    </div>
                    <div className="border border-b-[4px] border-b-[#eee] dark:border-b-[#1d1d1d] border-mainTheme/30 rounded-lg bg-white dark:bg-[#232323] overflow-hidden">
                      <div className="flex items-center bg-mainTheme/10 dark:bg-[#2c2c2c] px-3 py-2 font-medium text-sm border-b border-mainTheme/20">
                        <div className="flex-1 text-[#888]">{field.label}</div>
                        <div className="flex-1 text-center text-[#888]">
                          Cena
                        </div>
                        <div className="w-12 text-center"></div>
                      </div>
                      {pairs.length === 0 && (
                        <div className="px-3 py-4 text-center text-gray-400 text-sm bg-white dark:bg-[#232323]">
                          Brak wartości
                        </div>
                      )}
                      {pairs.map((pair, idx) => {
                        let priceStr = pair.price ?? "0.00";
                        if (typeof priceStr !== "string")
                          priceStr = String(priceStr);
                        if (!/^[0-9]+\.[0-9]{2}$/.test(priceStr)) {
                          const n = Number(priceStr);
                          priceStr = isNaN(n) ? "0.00" : n.toFixed(2);
                        }
                        const [intPart, decPart] = priceStr.split(".");
                        const rowKey = field.id + "-" + pair.value;
                        const localDec =
                          decInputs[rowKey] !== undefined
                            ? decInputs[rowKey]
                            : decPart;
                        return (
                          <div
                            key={pair.value + "-" + idx}
                            className={`w-full flex items-center px-3 py-2 border-b border-mainTheme/10 text-sm transition-colors ${
                              idx % 2 === 0
                                ? "bg-gray-50 dark:bg-[#232323]"
                                : "bg-[#eee] dark:bg-[#1c1c1c]"
                            } hover:bg-mainTheme/5`}
                          >
                            <div className="flex-1 font-semibold">
                              {pair.value}
                            </div>
                            <div className="flex-1 text-center text-gray-700 dark:text-gray-200">
                              <div className="flex items-center justify-center gap-1">
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  value={intPart}
                                  maxLength={6}
                                  onChange={(e) => {
                                    let newInt = e.target.value.replace(
                                      /\D/g,
                                      ""
                                    );
                                    if (newInt.length > 1)
                                      newInt = newInt.replace(/^0+/, "");
                                    if (newInt.length === 0) newInt = "0";
                                    const newPrice = `${newInt || "0"}.${(
                                      localDec || "00"
                                    ).padEnd(2, "0")}`;
                                    const newInputs = inputs.map((item) =>
                                      item.type === field.id &&
                                      item.value === pair.value
                                        ? { ...item, price: newPrice }
                                        : item
                                    );
                                    setInputs(newInputs);
                                  }}
                                  onFocus={(e) => e.target.select()}
                                  className="w-12 text-center px-1 py-1"
                                />
                                <span className="mx-0.5">.</span>
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  value={localDec === "00" ? "" : localDec}
                                  placeholder="00"
                                  onChange={(e) => {
                                    let val = e.target.value
                                      .replace(/\D/g, "")
                                      .slice(0, 2);
                                    setDecInputs((prev) => ({
                                      ...prev,
                                      [rowKey]: val,
                                    }));
                                    let newInt = intPart;
                                    if (newInt.length === 0) newInt = "0";
                                    const newPrice = `${newInt}.${(
                                      val || "00"
                                    ).padEnd(2, "0")}`;
                                    const newInputs = inputs.map((item) =>
                                      item.type === field.id &&
                                      item.value === pair.value
                                        ? { ...item, price: newPrice }
                                        : item
                                    );
                                    setInputs(newInputs);
                                  }}
                                  onFocus={(e) => e.target.select()}
                                  className="w-12 text-center px-1 py-1"
                                />
                                <span className="ml-1">zł</span>
                              </div>
                            </div>
                            <div className="w-12 flex justify-center">
                              <button
                                type="button"
                                className="text-red-500 hover:text-white hover:bg-red-500 rounded p-1 transition-colors"
                                onClick={() => removePair(pair.value)}
                                aria-label={`Usuń wartość ${pair.value}`}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
