"use client";
import { useProductContext } from "@/app/contexts/ProductContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Copy,
  PlusIcon,
  Trash2,
  Minus,
  Square,
  SquareCheck,
  Bookmark,
  X,
  Loader2,
} from "lucide-react";
import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  memo,
  useCallback,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { categories } from "@/app/contexts/ProductContext";
import { createConfigurationFromProduct } from "@/app/contexts/ProductContext";
import { Checkbox } from "@/components/ui/checkbox";
import {
  PRODUCT_INPUT_TYPES,
  type ProductInputConfig,
} from "@/app/contexts/inputTypes";
import { addMultipleProductsToCart } from "./lib/addToCart";
import { useCart } from "@/app/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { IndividualQuoteTooltip } from "@/app/components/IndividualQuoteTooltip";
import {
  calculateConfigurationPrice,
  getWidthHeightRange,
  needsCustomPricing,
} from "@/lib/pricing";

interface InvalidFields {
  [key: string]: boolean;
}

interface ConfigurationItemProps {
  config: import("@/app/contexts/ProductContext").ProductConfiguration;
  configIndex: number;
  selectedIdx: number;
  currentProduct: import("@/app/types/product").Product;
  configInputs: string[];
  productDataLoading: boolean;
  priceLoading: boolean;
  loadingConfigs: Set<string>;
  fetchedProducts: import("@/app/types/product").Product[];
  products: import("@/app/contexts/ProductContext").CartProduct[];
  invalidFields: InvalidFields;
  updateConfiguration: (
    productIdx: number,
    configIdx: number,
    config: Partial<
      import("@/app/contexts/ProductContext").ProductConfiguration
    >
  ) => void;
  removeConfiguration: (productIdx: number, configIdx: number) => void;
  setInvalidFields: React.Dispatch<React.SetStateAction<InvalidFields>>;
  handleDuplicate: (configIdx: number) => void;
  getConfigPrice: (
    product: import("@/app/types/product").Product,
    config: import("@/app/contexts/ProductContext").ProductConfiguration
  ) => number;
  needsCustomPricing: (
    product: import("@/app/types/product").Product,
    config: import("@/app/contexts/ProductContext").ProductConfiguration
  ) => boolean;
  renderField: (
    fieldId: string,
    cidx: number,
    config: import("@/app/contexts/ProductContext").ProductConfiguration,
    currentProduct: import("@/app/types/product").Product
  ) => React.ReactNode;
  PRODUCT_INPUT_TYPES: typeof PRODUCT_INPUT_TYPES;
  configRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
}

const ConfigurationItem = memo(
  function ConfigurationItem({
    config,
    configIndex,
    selectedIdx,
    currentProduct,
    configInputs,
    productDataLoading,
    priceLoading,
    loadingConfigs,
    fetchedProducts,
    products,
    invalidFields,
    updateConfiguration,
    removeConfiguration,
    setInvalidFields,
    handleDuplicate,
    getConfigPrice,
    needsCustomPricing,
    renderField,
    PRODUCT_INPUT_TYPES,
    configRefs,
  }: ConfigurationItemProps) {
    if (productDataLoading) {
      return (
        <div
          key={configIndex}
          className="border rounded-lg p-6 mb-4 relative bg-white shadow-lg dark:bg-[#333] dark:border-[#444]"
        >
          <div className="flex items-center mb-4">
            <div className="animate-pulse bg-gray-300 dark:bg-[#555] h-6 w-32 rounded"></div>
            <div className="flex items-center gap-2 ml-2">
              <div className="animate-pulse bg-gray-300 dark:bg-[#555] h-6 w-6 rounded"></div>
              <div className="animate-pulse bg-gray-300 dark:bg-[#555] h-6 w-6 rounded"></div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="animate-pulse bg-gray-300 dark:bg-[#555] h-10 w-full rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="animate-pulse bg-gray-300 dark:bg-[#555] h-10 w-full rounded"></div>
              <div className="animate-pulse bg-gray-300 dark:bg-[#555] h-10 w-full rounded"></div>
            </div>
            <div className="animate-pulse bg-gray-300 dark:bg-[#555] h-20 w-full rounded"></div>
          </div>
          <div className="mt-5 pt-3 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="animate-pulse bg-gray-300 dark:bg-[#555] h-6 w-16 rounded"></div>
              <div className="animate-pulse bg-gray-300 dark:bg-[#555] h-6 w-20 rounded"></div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        key={configIndex}
        ref={(el) => {
          if (configRefs?.current) {
            configRefs.current[configIndex] = el;
          }
        }}
        className="border rounded-lg p-6 mb-4 relative bg-white shadow-lg dark:bg-[#333] dark:border-[#444]"
      >
        <div className="flex items-center mb-4">
          <span className="font-semibold text-black dark:text-white mr-2">
            Konfiguracja
            {products[selectedIdx].configurations.length > 1 && (
              <span className="font-semibold text-mainTheme ml-1">
                [{configIndex + 1}]
              </span>
            )}
          </span>
          <div className="flex items-center gap-2 ml-2">
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    className="p-1 rounded hover:text-mainTheme"
                    onClick={() => handleDuplicate(configIndex)}
                  >
                    <Copy size={18} />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-[#777] text-white">
                  <p>Duplikuj konfigurację</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {products[selectedIdx].configurations.length > 1 && (
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <button
                      className="p-1 rounded hover:text-red-600"
                      onClick={() =>
                        removeConfiguration(selectedIdx, configIndex)
                      }
                    >
                      <Trash2 size={18} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-[#777] text-white">
                    <p>Usuń konfigurację</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          {currentProduct?.subvariants &&
            currentProduct.subvariants.length > 0 && (
              <div className="lg:col-span-2">
                <Label className="text-slate-800 dark:text-white">Typ</Label>
                <Select
                  value={config.subvariant || ""}
                  onValueChange={(value) => {
                    const selectedSubvariant = value;
                    const newSubvariantInputs =
                      currentProduct.inputsBySubvariant?.[selectedSubvariant] ||
                      [];
                    const newConfig: any = { subvariant: value };
                    const tempConfig = createConfigurationFromProduct(
                      currentProduct,
                      selectedSubvariant
                    );
                    Object.assign(newConfig, tempConfig);
                    newConfig.subvariant = selectedSubvariant;
                    updateConfiguration(selectedIdx, configIndex, newConfig);
                    setInvalidFields((prev: any) => ({
                      ...prev,
                      [`${selectedIdx}-${configIndex}-subvariant`]: false,
                    }));
                  }}
                >
                  <SelectTrigger
                    className={
                      invalidFields[`${selectedIdx}-${configIndex}-subvariant`]
                        ? "border-red-500 dark:border-red-500 dark:bg-[#444] dark:text-white"
                        : "border-[#ccc] dark:border-[#555] dark:bg-[#444] dark:text-white"
                    }
                  >
                    <SelectValue placeholder="Wybierz typ" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentProduct.subvariants.map((subvariant: string) => (
                      <SelectItem key={subvariant} value={subvariant}>
                        {subvariant}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {invalidFields[`${selectedIdx}-${configIndex}-subvariant`] && (
                  <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                    Pole „Wariant” jest wymagane.
                  </p>
                )}
              </div>
            )}

          {configInputs.length > 0 && (
            <div className="sm:border border-[#dcdcdc] dark:border-[#3c3c3c] rounded-lg sm:p-3 sm:bg-[#fbfbfb] sm:dark:bg-[#313131]">
              <div className="font-semibold text-base mb-4 text-mainTheme">
                Konfiguracja produktu
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PRODUCT_INPUT_TYPES.filter((field) =>
                  configInputs.includes(field.id)
                ).map((field) => (
                  <div key={field.id}>
                    {renderField(field.id, configIndex, config, currentProduct)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>


        <div className="mt-4">
          <Label className="text-slate-800 dark:text-white text-sm">
            Notatka (opcjonalnie)
          </Label>
          <textarea
            placeholder="Dodaj szczegóły lub uwagi dotyczące tej konfiguracji..."
            className="w-full mt-1 p-3 border rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-[#333] dark:focus:ring-[#ccc] bg-white dark:bg-[#444] dark:text-white border-[#ccc] dark:border-[#555] placeholder:text-sm placeholder:text-[#888]"
            rows={3}
            value={config.note || ""}
            onChange={(e) => {
              updateConfiguration(selectedIdx, configIndex, {
                note: e.target.value,
              });
            }}
          />
        </div>

        <div className="mt-5 pt-3 border-t border-gray-200">
          <div className="flex flex-col gap-3 sm:gap-0 sm:flex-row justify-between sm:items-center">
            <div>
              <Label className="text-slate-800 dark:text-white text-sm">
                Ilość
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-9 w-9 px-0 border bg-transparent border-[#ccc]"
                  onClick={() => {
                    if (config.quantity > 1) {
                      updateConfiguration(selectedIdx, configIndex, {
                        quantity: config.quantity - 1,
                      });
                      setInvalidFields((prev: any) => ({
                        ...prev,
                        [`${selectedIdx}-${configIndex}-quantity`]: false,
                      }));
                    }
                  }}
                >
                  <Minus size={16} />
                </Button>
                <Input
                  className={
                    invalidFields[`${selectedIdx}-${configIndex}-quantity`]
                      ? "border-red-500 text-center dark:border-red-500 dark:bg-[#444] dark:text-white"
                      : "border-[#ccc] text-center dark:border-[#555] dark:bg-[#444] dark:text-white"
                  }
                  type="number"
                  min={1}
                  value={config.quantity}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    updateConfiguration(selectedIdx, configIndex, {
                      quantity: Number(e.target.value),
                    });
                    setInvalidFields((prev: any) => ({
                      ...prev,
                      [`${selectedIdx}-${configIndex}-quantity`]: false,
                    }));
                  }}
                  onBlur={(e) => {
                    let val = parseInt(e.target.value, 10);
                    if (isNaN(val) || val < 1) {
                      updateConfiguration(selectedIdx, configIndex, {
                        quantity: 1,
                      });
                    }
                  }}
                  style={{ maxWidth: 70 }}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-9 w-9 px-0 border bg-transparent border-[#ccc]"
                  onClick={() => {
                    updateConfiguration(selectedIdx, configIndex, {
                      quantity: config.quantity + 1,
                    });
                    setInvalidFields((prev: any) => ({
                      ...prev,
                      [`${selectedIdx}-${configIndex}-quantity`]: false,
                    }));
                  }}
                >
                  <PlusIcon size={16} />
                </Button>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-[#bbb]">
                Wycena
              </div>
              <div className="font-semibold text-black dark:text-white max-w-[130px] overflow-hidden text-ellipsis whitespace-nowrap block">
                {(() => {
                  const configKey = `${selectedIdx}-${configIndex}`;
                  const isThisConfigLoading = loadingConfigs.has(configKey);

                  const dbProduct = fetchedProducts.find(
                    (p) => p.id === products[selectedIdx]?.id
                  );

                  const needsIndividualQuote =
                    !dbProduct?.pricingTemplate?.id ||
                    (dbProduct && needsCustomPricing(dbProduct, config));

                  if (needsIndividualQuote) {
                    return (
                      <div className="flex justify-center w-full items-center gap-1">
                        <IndividualQuoteTooltip
                          variant="single"
                          className="mt-1"
                        />
                      </div>
                    );
                  }

                  const price = dbProduct
                    ? getConfigPrice(dbProduct, config)
                    : 0;
                  const total = price * config.quantity;
                  return (
                    <>
                      {isNaN(total) ? "0.00" : total.toFixed(2)}{" "}
                      <span className="text-xs font-normal">zł</span>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    const configChanged =
      JSON.stringify(prevProps.config) !== JSON.stringify(nextProps.config);
    const configIndexChanged = prevProps.configIndex !== nextProps.configIndex;
    const selectedIdxChanged = prevProps.selectedIdx !== nextProps.selectedIdx;

    const thisConfigPrefix = `${prevProps.selectedIdx}-${prevProps.configIndex}-`;
    const prevInvalidForThisConfig = Object.keys(prevProps.invalidFields)
      .filter((key) => key.startsWith(thisConfigPrefix))
      .reduce(
        (obj, key) => ({ ...obj, [key]: prevProps.invalidFields[key] }),
        {}
      );
    const nextInvalidForThisConfig = Object.keys(nextProps.invalidFields)
      .filter((key) => key.startsWith(thisConfigPrefix))
      .reduce(
        (obj, key) => ({ ...obj, [key]: nextProps.invalidFields[key] }),
        {}
      );

    const invalidFieldsChanged =
      JSON.stringify(prevInvalidForThisConfig) !==
      JSON.stringify(nextInvalidForThisConfig);

    const shouldRerender =
      configChanged ||
      configIndexChanged ||
      selectedIdxChanged ||
      invalidFieldsChanged;

    return !shouldRerender;
  }
);

export default function Order() {
  const {
    products,
    addProduct,
    removeProduct,
    addConfiguration,
    updateConfiguration,
    removeConfiguration,
    availableProducts,
    fetchedProducts,
    addDefaultConfiguration,
    priceLoading,
    setPriceLoading,
    setProducts,
    fetchProducts,
    loadingProducts,
    productsError,
  } = useProductContext();

  const { toast } = useToast();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit") ?? null;
  const { refreshCart, items: cartItems, cartLoading, updateItem } = useCart();
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [productSwitching, setProductSwitching] = useState(false);

  const stableUpdateConfiguration = useCallback(updateConfiguration, [
    updateConfiguration,
  ]);
  const stableRemoveConfiguration = useCallback(removeConfiguration, [
    removeConfiguration,
  ]);

  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [openDeleteIdx, setOpenDeleteIdx] = useState<number | null>(null);
  const [invalidFields, setInvalidFields] = useState<InvalidFields>({});
  const [openAddToCartConfirm, setOpenAddToCartConfirm] = useState(false);
  const [orderName, setOrderName] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const editLoadAttemptedRef = useRef<string | null>(null);

  const stableSetInvalidFields = useCallback(setInvalidFields, [
    setInvalidFields,
  ]);

  const configRefs = useRef<(HTMLDivElement | null)[]>([]);
  const router = useRouter();
  const productDataLoading = loadingProducts && fetchedProducts.length === 0;
  const asideListRef = useRef<HTMLDivElement>(null);
  const productCardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const selectedProductData = availableProducts.find(
    (p) => p.title === selectedProduct
  );

  const productSwitchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const handleProductSelection = useCallback(
    (idx: number) => {
      if (idx === selectedIdx) return;

      if (productSwitchTimeoutRef.current) {
        clearTimeout(productSwitchTimeoutRef.current);
        productSwitchTimeoutRef.current = null;
      }

      setProductSwitching(true);
      setSelectedIdx(idx);

      window.scrollTo({ top: 0 });

      productSwitchTimeoutRef.current = setTimeout(() => {
        productSwitchTimeoutRef.current = null;
        setProductSwitching(false);
      }, 300);
    },
    [selectedIdx]
  );

  useEffect(() => {
    return () => {
      if (productSwitchTimeoutRef.current) {
        clearTimeout(productSwitchTimeoutRef.current);
      }
    };
  }, []);

  const handleAddProduct = () => {
    if (selectedProduct && selectedVariant) {
      const fetchedProduct = fetchedProducts.find(
        (p) => p.variant === selectedVariant && p.category === selectedProduct
      );

      if (!fetchedProduct) {
        return;
      }

      const id = fetchedProduct.id;
      const category = fetchedProduct.category;
      const existingIdx = products.findIndex(
        (item) => item.id === id && item.variant === selectedVariant
      );

      const initialConfig = createConfigurationFromProduct(fetchedProduct);

      addProduct({
        id,
        category,
        variant: selectedVariant,
        quantity: 1,
        configurations: [initialConfig],
      });

      setSelectedProduct("");
      setSelectedVariant("");
      setDialogOpen(false);

      if (existingIdx !== -1) {
        setSelectedIdx(existingIdx);
      } else {
        setSelectedIdx(products.length);
      }
    } else {
    }
  };

  const handleDuplicate = useCallback(
    (cidx: number) => {
      const configToDuplicate = {
        ...products[selectedIdx].configurations[cidx],
      };
      addConfiguration(selectedIdx, configToDuplicate);
    },
    [products, selectedIdx, addConfiguration]
  );

  const handleAddConfiguration = useCallback(() => {
    addDefaultConfiguration(selectedIdx);
  }, [selectedIdx, addDefaultConfiguration]);

  const prevConfigCountRef = useRef<number>(
    products[selectedIdx]?.configurations.length || 0
  );

  useEffect(() => {
    const configs = products[selectedIdx]?.configurations;
    if (!configs) return;
    const prevCount = prevConfigCountRef.current;
    if (configs.length > prevCount) {
      const newIdx = configs.length - 1;
      const el = configRefs.current[newIdx];
      if (el) {
        const rect = el.getBoundingClientRect();
        const scrollTop = window.scrollY || window.pageYOffset;
        const offset = 80;
        window.scrollTo({
          top: rect.top + scrollTop - offset,
          behavior: "smooth",
        });
      }
    }
    prevConfigCountRef.current = configs.length;
  }, [products[selectedIdx]?.configurations.length, selectedIdx]);

  const getConfigPrice = useCallback(
    (
      product: import("@/app/types/product").Product,
      config: import("@/app/contexts/ProductContext").ProductConfiguration
    ): number => calculateConfigurationPrice(product, config),
    []
  );

  const calculateTotalPrice = useMemo(() => {
    return products.reduce((total, product) => {
      const productTotal = product.configurations.reduce(
        (configTotal, config) => {
          const dbProduct = fetchedProducts.find((p) => p.id === product.id);
          if (!dbProduct) return configTotal;
          const price = getConfigPrice(dbProduct, config);
          const configTotalPrice = price * config.quantity;
          return configTotal + (isNaN(configTotalPrice) ? 0 : configTotalPrice);
        },
        0
      );
      return total + (isNaN(productTotal) ? 0 : productTotal);
    }, 0);
  }, [products, fetchedProducts]);

  const handleAddToCart = useCallback(async () => {
    setIsAddingToCart(true);
    try {
      const productsWithPrices = products.map((product) => {
        const dbProduct = fetchedProducts.find((p) => p.id === product.id);
        if (!dbProduct) return product;

        const configurationsWithPrices = product.configurations.map(
          (config) => {
            const price = getConfigPrice(dbProduct, config);
            const safePrice =
              typeof price === "number" && !isNaN(price) ? price : 0;
            const needsIndividualQuote =
              !dbProduct?.pricingTemplate?.id ||
              needsCustomPricing(dbProduct, config);
            return {
              ...config,
              price: safePrice,
              needsIndividualQuote,
            };
          }
        );

        return {
          ...product,
          configurations: configurationsWithPrices,
        };
      });

      const totalAmount = productsWithPrices.reduce(
        (sum, product) =>
          sum +
          product.configurations.reduce(
            (s, c) => s + (c.price ?? 0) * (c.quantity ?? 1),
            0
          ),
        0
      );

      if (editId) {
        await updateItem(editId, {
          products: productsWithPrices,
          totalAmount: Math.round(totalAmount * 100) / 100,
          orderName: (orderName ?? "").trim(),
        });
        await refreshCart();
        router.push("/koszyk");
      } else {
        const result = await addMultipleProductsToCart(
          productsWithPrices,
          orderName?.trim() || undefined
        );

        if (result.success) {
          await refreshCart();
          router.push("/koszyk");
        } else {
          toast({
            title: "Błąd",
            description:
              result.error || "Nie udało się dodać produktów do koszyka",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : null;
      toast({
        title: "Błąd",
        description:
          message ||
          (editId
            ? "Wystąpił błąd podczas zapisywania zmian"
            : "Wystąpił błąd podczas dodawania do koszyka"),
        variant: "destructive",
      });
    } finally {
      setIsAddingToCart(false);
    }
  }, [
    products,
    fetchedProducts,
    getConfigPrice,
    needsCustomPricing,
    router,
    toast,
    editId,
    updateItem,
    refreshCart,
    orderName,
  ]);

  function getInputConfig(
    inputType: string,
    configIdx: number,
    forProductIdx?: number
  ) {
    const productIdx = forProductIdx ?? selectedIdx;
    const product = products[productIdx];
    const dbProduct = fetchedProducts.find((p) => p.id === product?.id);
    if (!dbProduct || !product) return null;
    const config = product.configurations[configIdx];
    if (!config) return null;
    let inputConfig = null;
    if (dbProduct.subvariants && dbProduct.subvariants.length > 0) {
      const selectedSubvariant = config.subvariant || dbProduct.subvariants[0];
      let subvariantInputs: any[] = [];
      if (
        dbProduct.inputsBySubvariant &&
        dbProduct.inputsBySubvariant[selectedSubvariant]
      ) {
        subvariantInputs = dbProduct.inputsBySubvariant[selectedSubvariant];
      } else if (
        dbProduct.inputs &&
        typeof dbProduct.inputs === "object" &&
        !Array.isArray(dbProduct.inputs) &&
        selectedSubvariant in dbProduct.inputs
      ) {
        subvariantInputs = (dbProduct.inputs as Record<string, any[]>)[
          selectedSubvariant
        ];
      } else if (
        dbProduct.inputsBySubvariant &&
        dbProduct.inputsBySubvariant.main
      ) {
        subvariantInputs = dbProduct.inputsBySubvariant.main;
      } else if (
        dbProduct.inputs &&
        typeof dbProduct.inputs === "object" &&
        !Array.isArray(dbProduct.inputs) &&
        "main" in dbProduct.inputs
      ) {
        subvariantInputs = (dbProduct.inputs as Record<string, any[]>)["main"];
      } else if (Array.isArray(dbProduct.inputs)) {
        subvariantInputs = dbProduct.inputs;
      }
      inputConfig = subvariantInputs.find((input) => input.type === inputType);
    } else {
      let mainInputs: any[] = [];
      if (dbProduct.inputsBySubvariant?.main) {
        mainInputs = dbProduct.inputsBySubvariant.main;
      } else if (
        dbProduct.inputs &&
        typeof dbProduct.inputs === "object" &&
        !Array.isArray(dbProduct.inputs) &&
        "main" in dbProduct.inputs
      ) {
        mainInputs = (dbProduct.inputs as Record<string, any[]>)["main"];
      } else if (Array.isArray(dbProduct.inputs)) {
        mainInputs = dbProduct.inputs;
      }
      inputConfig = mainInputs.find((input) => input.type === inputType);
    }
    return inputConfig;
  }

  const validateCurrentProduct = () => {
    const inputTypeToConfigKey: Record<string, string> = {};
    PRODUCT_INPUT_TYPES.forEach((field) => {
      inputTypeToConfigKey[field.id] = field.configKey;
    });
    const product = products[selectedIdx];
    if (!product) {
      return true;
    }
    let firstInvalidIdx = -1;
    let firstInvalidKey: string | null = null;
    const newInvalidFields: { [key: string]: boolean } = {};
    const prefix = `${selectedIdx}-`;
    const markInvalid = (key: string, setFirst = true) => {
      const fullKey = `${selectedIdx}-${key}`;
      newInvalidFields[fullKey] = true;
      if (setFirst && firstInvalidIdx === -1) {
        const parts = key.split("-");
        if (parts.length >= 1) {
          const cidx = parseInt(parts[0], 10);
          if (!isNaN(cidx)) firstInvalidIdx = cidx;
        }
        if (!firstInvalidKey) firstInvalidKey = fullKey;
      }
    };
    product.configurations.forEach((config, cidx) => {
      const configInputs = getInputsForConfiguration(cidx);
      configInputs.forEach((inputType) => {
        const inputConfig = getInputConfig(inputType, cidx);
        if (inputType === "HANDLE") {
          const key =
            inputTypeToConfigKey[inputType] || inputType.toLowerCase();
          const value = (config as Record<string, any>)[key];
          if (value === "Własne") {
            const handleValue = (config as Record<string, any>).handleValue;
            if (
              !handleValue ||
              handleValue === "" ||
              isNaN(parseInt(handleValue, 10)) ||
              parseInt(handleValue, 10) < 1
            ) {
              markInvalid(`${cidx}-${key}`);
            }
          }
        }

        const field = PRODUCT_INPUT_TYPES.find((f) => f.id === inputType);
        if (field?.pairedWith) {
          const key = field.configKey;
          const pairedKey = PRODUCT_INPUT_TYPES.find(
            (f) => f.id === field.pairedWith
          )?.configKey;

          if (pairedKey) {
            const value = (config as Record<string, any>)[key];
            const pairedValue = (config as Record<string, any>)[pairedKey];

            const isEmpty = (val: any) => {
              if (typeof val === "string") return !val || val.trim() === "";
              if (typeof val === "number") return false;
              return !val;
            };

            if (isEmpty(value) && isEmpty(pairedValue)) {
              markInvalid(`${cidx}-${key}`);
              markInvalid(`${cidx}-${pairedKey}`, false);
            }
            else {
              delete newInvalidFields[`${prefix}${cidx}-${key}`];
              delete newInvalidFields[`${prefix}${cidx}-${pairedKey}`];
            }
            return;
          }
        }

        if (inputConfig && inputConfig.required) {
          const key =
            inputTypeToConfigKey[inputType] || inputType.toLowerCase();
          let value = (config as Record<string, any>)[key];

          const isEmpty = (val: any) => {
            if (typeof val === "string") return !val || val.trim() === "";
            if (typeof val === "number") return isNaN(val);
            return !val;
          };

          if (isEmpty(value)) {
            markInvalid(`${cidx}-${key}`);
          }
        }
      });
      if (
        currentProduct?.subvariants &&
        currentProduct.subvariants.length > 0 &&
        (!config.subvariant || config.subvariant.trim() === "")
      ) {
        markInvalid(`${cidx}-subvariant`);
      }
    });
    setInvalidFields((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (k.startsWith(`${selectedIdx}-`)) delete next[k];
      });
      return { ...next, ...newInvalidFields };
    });
    if (firstInvalidIdx !== -1 && configRefs.current[firstInvalidIdx]) {
      configRefs.current[firstInvalidIdx]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
    return Object.keys(newInvalidFields).length === 0;
  };

  const validateAllProducts = () => {
    const inputTypeToConfigKey: Record<string, string> = {};
    PRODUCT_INPUT_TYPES.forEach((field) => {
      inputTypeToConfigKey[field.id] = field.configKey;
    });
    const allInvalidFields: { [key: string]: boolean } = {};
    let firstInvalidProductIdx = -1;
    let firstInvalidConfigIdx = -1;

    for (let productIdx = 0; productIdx < products.length; productIdx++) {
      const product = products[productIdx];
      const dbProduct = fetchedProducts.find((p) => p.id === product.id);
      if (!dbProduct) continue;

      const prefix = `${productIdx}-`;
      const markInvalid = (key: string) => {
        const fullKey = `${productIdx}-${key}`;
        allInvalidFields[fullKey] = true;
        if (firstInvalidProductIdx === -1) {
          const parts = key.split("-");
          if (parts.length >= 1) {
            firstInvalidConfigIdx = parseInt(parts[0], 10);
            if (!isNaN(firstInvalidConfigIdx))
              firstInvalidProductIdx = productIdx;
          }
        }
      };

      product.configurations.forEach((config, cidx) => {
        const configInputs = getInputsForConfiguration(cidx, productIdx);
        configInputs.forEach((inputType) => {
          const inputConfig = getInputConfig(inputType, cidx, productIdx);
          if (inputType === "HANDLE") {
            const key =
              inputTypeToConfigKey[inputType] || inputType.toLowerCase();
            const value = (config as Record<string, any>)[key];
            if (value === "Własne") {
              const handleValue = (config as Record<string, any>).handleValue;
              if (
                !handleValue ||
                handleValue === "" ||
                isNaN(parseInt(handleValue, 10)) ||
                parseInt(handleValue, 10) < 1
              ) {
                markInvalid(`${cidx}-${key}`);
              }
            }
          }

          const field = PRODUCT_INPUT_TYPES.find((f) => f.id === inputType);
          if (field?.pairedWith) {
            const key = field.configKey;
            const pairedKey = PRODUCT_INPUT_TYPES.find(
              (f) => f.id === field.pairedWith
            )?.configKey;
            if (pairedKey) {
              const value = (config as Record<string, any>)[key];
              const pairedValue = (config as Record<string, any>)[pairedKey];
              const isEmpty = (val: any) => {
                if (typeof val === "string") return !val || val.trim() === "";
                if (typeof val === "number") return false;
                return !val;
              };
              if (isEmpty(value) && isEmpty(pairedValue)) {
                markInvalid(`${cidx}-${key}`);
                markInvalid(`${cidx}-${pairedKey}`);
              } else {
                delete allInvalidFields[`${prefix}${cidx}-${key}`];
                delete allInvalidFields[`${prefix}${cidx}-${pairedKey}`];
              }
            }
            return;
          }

          if (inputConfig && inputConfig.required) {
            const key =
              inputTypeToConfigKey[inputType] || inputType.toLowerCase();
            const value = (config as Record<string, any>)[key];
            const isEmpty = (val: any) => {
              if (typeof val === "string") return !val || val.trim() === "";
              if (typeof val === "number") return isNaN(val);
              return !val;
            };
            if (isEmpty(value)) {
              markInvalid(`${cidx}-${key}`);
            }
          }
        });

        if (
          dbProduct?.subvariants &&
          dbProduct.subvariants.length > 0 &&
          (!config.subvariant || config.subvariant.trim() === "")
        ) {
          markInvalid(`${cidx}-subvariant`);
        }
      });
    }

    setInvalidFields(allInvalidFields);
    if (Object.keys(allInvalidFields).length > 0) {
      if (firstInvalidProductIdx >= 0) {
        setSelectedIdx(firstInvalidProductIdx);
        setTimeout(() => {
          if (
            firstInvalidConfigIdx >= 0 &&
            configRefs.current[firstInvalidConfigIdx]
          ) {
            configRefs.current[firstInvalidConfigIdx]?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }, 100);
      }
      return false;
    }
    return true;
  };

  function isProductValid(product: (typeof products)[number]) {
    const dbProduct = fetchedProducts.find((p) => p.id === product.id);
    if (!dbProduct) return false;
    return product.configurations.every((config, cidx) => {
      let inputConfigs: any[] = [];
      if (dbProduct.subvariants && dbProduct.subvariants.length > 0) {
        const selectedSubvariant =
          config.subvariant || dbProduct.subvariants[0];
        if (
          dbProduct.inputsBySubvariant &&
          dbProduct.inputsBySubvariant[selectedSubvariant]
        ) {
          inputConfigs = dbProduct.inputsBySubvariant[selectedSubvariant];
        } else if (
          dbProduct.inputs &&
          typeof dbProduct.inputs === "object" &&
          !Array.isArray(dbProduct.inputs) &&
          selectedSubvariant in dbProduct.inputs
        ) {
          inputConfigs = (dbProduct.inputs as Record<string, any[]>)[
            selectedSubvariant
          ];
        } else if (
          dbProduct.inputsBySubvariant &&
          dbProduct.inputsBySubvariant.main
        ) {
          inputConfigs = dbProduct.inputsBySubvariant.main;
        } else if (
          dbProduct.inputs &&
          typeof dbProduct.inputs === "object" &&
          !Array.isArray(dbProduct.inputs) &&
          "main" in dbProduct.inputs
        ) {
          inputConfigs = (dbProduct.inputs as Record<string, any[]>)["main"];
        } else if (Array.isArray(dbProduct.inputs)) {
          inputConfigs = dbProduct.inputs;
        }
      } else {
        if (dbProduct.inputsBySubvariant?.main) {
          inputConfigs = dbProduct.inputsBySubvariant.main;
        } else if (
          dbProduct.inputs &&
          typeof dbProduct.inputs === "object" &&
          !Array.isArray(dbProduct.inputs) &&
          "main" in dbProduct.inputs
        ) {
          inputConfigs = (dbProduct.inputs as Record<string, any[]>)["main"];
        } else if (Array.isArray(dbProduct.inputs)) {
          inputConfigs = dbProduct.inputs;
        }
      }
      const inputTypeToConfigKey: Record<string, string> = {};
      PRODUCT_INPUT_TYPES.forEach((field) => {
        inputTypeToConfigKey[field.id] = field.configKey;
      });

      const validatedPairedFields = new Set<string>();

      for (const input of inputConfigs) {
        const field = PRODUCT_INPUT_TYPES.find((f) => f.id === input.type);
        if (field?.pairedWith && !validatedPairedFields.has(field.id)) {
          const key = field.configKey;
          const pairedKey = PRODUCT_INPUT_TYPES.find(
            (f) => f.id === field.pairedWith
          )?.configKey;

          if (pairedKey) {
            validatedPairedFields.add(field.id);
            validatedPairedFields.add(field.pairedWith);

            const value = (config as Record<string, any>)[key];
            const pairedValue = (config as Record<string, any>)[pairedKey];

            const isEmpty = (val: any) => {
              if (typeof val === "string") return !val || val.trim() === "";
              if (typeof val === "number") return false;
              return !val;
            };

            if (isEmpty(value) && isEmpty(pairedValue)) {
              return false;
            }
          }
        }
      }

      for (const input of inputConfigs) {
        if (input.type === "HANDLE") {
          const key =
            inputTypeToConfigKey[input.type] || input.type.toLowerCase();
          const value = (config as Record<string, any>)[key];
          if (value === "Własne") {
            const handleValue = (config as Record<string, any>).handleValue;
            if (
              !handleValue ||
              handleValue === "" ||
              isNaN(parseInt(handleValue, 10)) ||
              parseInt(handleValue, 10) < 1
            ) {
              return false;
            }
          }
        }
      }

      for (const input of inputConfigs) {
        const field = PRODUCT_INPUT_TYPES.find((f) => f.id === input.type);
        if (
          input.required &&
          !field?.pairedWith &&
          !validatedPairedFields.has(input.type)
        ) {
          const key =
            inputTypeToConfigKey[input.type] || input.type.toLowerCase();
          const value = (config as Record<string, any>)[key];

          if (
            value === undefined ||
            value === null ||
            (typeof value === "string" && value.trim() === "") ||
            (typeof value === "number" && isNaN(value))
          ) {
            return false;
          }
        }
      }
      if (
        dbProduct.subvariants &&
        dbProduct.subvariants.length > 0 &&
        inputConfigs.some(
          (input) => input.type === "SUBVARIANT" && input.required
        )
      ) {
        if (!config.subvariant || config.subvariant.trim() === "") {
          return false;
        }
      }
      return true;
    });
  }

  const isAllProductsValid = () => {
    return products.every(isProductValid);
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue =
        "Uwaga! Odświeżenie lub opuszczenie tej strony spowoduje utratę szczegółów zamówienia.";
      return e.returnValue;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    if (!editId && products.length === 0) {
      router.replace("/nowe-zamowienie");
    }
  }, [editId, products.length, router]);

  useEffect(() => {
    if (!editId || cartLoading || editLoadAttemptedRef.current === editId)
      return;
    editLoadAttemptedRef.current = editId;
    const entry = cartItems.find((i) => i.id === editId);
    if (!entry) {
      router.replace("/koszyk");
      setInitialLoading(false);
      return;
    }
    setProducts(entry.products);
    setSelectedIdx(0);
    setOrderName(entry.orderName ?? "");
    setInitialLoading(false);
  }, [editId, cartLoading, cartItems, setProducts, router]);

  useEffect(() => {
    if (products.length > 0) {
      setInitialLoading(false);
    }
  }, [products.length]);

  useEffect(() => {
    const t = setTimeout(() => setInitialLoading(false), 5000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (
      products.length > 0 &&
      (selectedIdx >= products.length || selectedIdx < 0)
    ) {
      setSelectedIdx(0);
    }
  }, [selectedIdx, products.length]);

  const currentProduct = fetchedProducts.find(
    (p) => p.id === products[selectedIdx]?.id
  );

  const getProductInputs = () => {
    if (!currentProduct) return [];

    if (currentProduct.subvariants && currentProduct.subvariants.length > 0) {
      const selectedConfig = products[selectedIdx]?.configurations[0];
      const selectedSubvariant =
        selectedConfig?.subvariant || currentProduct.subvariants[0];

      let subvariantInputs: any[] = [];

      if (
        currentProduct.inputsBySubvariant &&
        currentProduct.inputsBySubvariant[selectedSubvariant]
      ) {
        subvariantInputs =
          currentProduct.inputsBySubvariant[selectedSubvariant];
      }
      else if (
        currentProduct.inputs &&
        typeof currentProduct.inputs === "object" &&
        !Array.isArray(currentProduct.inputs) &&
        selectedSubvariant in currentProduct.inputs
      ) {
        subvariantInputs = (currentProduct.inputs as Record<string, any[]>)[
          selectedSubvariant
        ];
      }
      else if (
        currentProduct.inputsBySubvariant &&
        currentProduct.inputsBySubvariant.main
      ) {
        subvariantInputs = currentProduct.inputsBySubvariant.main;
      }
      else if (
        currentProduct.inputs &&
        typeof currentProduct.inputs === "object" &&
        !Array.isArray(currentProduct.inputs) &&
        "main" in currentProduct.inputs
      ) {
        subvariantInputs = (currentProduct.inputs as Record<string, any[]>)[
          "main"
        ];
      }
      else if (Array.isArray(currentProduct.inputs)) {
        subvariantInputs = currentProduct.inputs;
      }

      return subvariantInputs.map((input: any) => input.type);
    } else {
      let mainInputs: any[] = [];

      if (currentProduct.inputsBySubvariant?.main) {
        mainInputs = currentProduct.inputsBySubvariant.main;
      }
      else if (
        currentProduct.inputs &&
        typeof currentProduct.inputs === "object" &&
        !Array.isArray(currentProduct.inputs) &&
        "main" in currentProduct.inputs
      ) {
        mainInputs = (currentProduct.inputs as Record<string, any[]>)["main"];
      }
      else if (Array.isArray(currentProduct.inputs)) {
        mainInputs = currentProduct.inputs;
      }

      return mainInputs.map((input: any) => input.type);
    }
  };

  const [productInputs, setProductInputs] = useState<string[]>([]);

  const getInputsForConfiguration = (
    configIdx: number,
    forProductIdx?: number
  ) => {
    const productIdx = forProductIdx ?? selectedIdx;
    const product = products[productIdx];
    const dbProduct = fetchedProducts.find((p) => p.id === product?.id);
    if (!dbProduct || !product) return [];

    const config = product.configurations[configIdx];
    if (!config) return [];

    if (dbProduct.subvariants && dbProduct.subvariants.length > 0) {
      const selectedSubvariant = config.subvariant || dbProduct.subvariants[0];
      let subvariantInputs: any[] = [];

      if (
        dbProduct.inputsBySubvariant &&
        dbProduct.inputsBySubvariant[selectedSubvariant]
      ) {
        subvariantInputs = dbProduct.inputsBySubvariant[selectedSubvariant];
      }
      else if (
        dbProduct.inputs &&
        typeof dbProduct.inputs === "object" &&
        !Array.isArray(dbProduct.inputs) &&
        selectedSubvariant in dbProduct.inputs
      ) {
        subvariantInputs = (dbProduct.inputs as Record<string, any[]>)[
          selectedSubvariant
        ];
      }
      else if (
        dbProduct.inputsBySubvariant &&
        dbProduct.inputsBySubvariant.main
      ) {
        subvariantInputs = dbProduct.inputsBySubvariant.main;
      }
      else if (
        dbProduct.inputs &&
        typeof dbProduct.inputs === "object" &&
        !Array.isArray(dbProduct.inputs) &&
        "main" in dbProduct.inputs
      ) {
        subvariantInputs = (dbProduct.inputs as Record<string, any[]>)["main"];
      }
      else if (Array.isArray(dbProduct.inputs)) {
        subvariantInputs = dbProduct.inputs;
      }

      return subvariantInputs.map((input: any) => input.type);
    } else {
      let mainInputs: any[] = [];

      if (dbProduct.inputsBySubvariant?.main) {
        mainInputs = dbProduct.inputsBySubvariant.main;
      }
      else if (
        dbProduct.inputs &&
        typeof dbProduct.inputs === "object" &&
        !Array.isArray(dbProduct.inputs) &&
        "main" in dbProduct.inputs
      ) {
        mainInputs = (dbProduct.inputs as Record<string, any[]>)["main"];
      }
      else if (Array.isArray(dbProduct.inputs)) {
        mainInputs = dbProduct.inputs;
      }

      return mainInputs.map((input: any) => input.type);
    }
  };

  useEffect(() => {
    setProductInputs(getProductInputs());
  }, [products, selectedIdx, currentProduct]);

  const prevPricesRef = useRef<{ [key: string]: number }>({});
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [loadingConfigs, setLoadingConfigs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (products.length > 0 && fetchedProducts.length > 0) {
      const currentPrices: { [key: string]: number } = {};
      const changingConfigs = new Set<string>();

      products.forEach((product, productIdx) => {
        const dbProduct = fetchedProducts.find((p) => p.id === product.id);
        if (dbProduct) {
          product.configurations.forEach((config, configIdx) => {
            const priceKey = `${productIdx}-${configIdx}`;
            const currentPrice = getConfigPrice(dbProduct, config);
            currentPrices[priceKey] = currentPrice;

            if (
              prevPricesRef.current[priceKey] !== undefined &&
              Math.abs(prevPricesRef.current[priceKey] - currentPrice) > 0.01
            ) {
              changingConfigs.add(priceKey);
            }
          });
        }
      });

      if (changingConfigs.size > 0) {
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }

        setLoadingConfigs(changingConfigs);
        loadingTimeoutRef.current = setTimeout(() => {
          setLoadingConfigs(new Set());
        }, 300);
      }

      prevPricesRef.current = currentPrices;
    }
  }, [products, fetchedProducts, setPriceLoading]);

  const configInputsList = useMemo(
    () =>
      products[selectedIdx]?.configurations.map((_, cidx) =>
        getInputsForConfiguration(cidx)
      ) || [],
    [products[selectedIdx], fetchedProducts]
  );

  useEffect(() => {
    if (asideListRef.current && productCardRefs.current[selectedIdx]) {
      const container = asideListRef.current;
      const card = productCardRefs.current[selectedIdx];
      const containerRect = container.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      if (
        cardRect.top < containerRect.top ||
        cardRect.bottom > containerRect.bottom
      ) {
        card.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [selectedIdx, products.length]);

  type FormField = {
    id: string;
    type: "number" | "select" | "checkbox" | "handle";
    label: string;
    section: string;
    configKey: string;
    validationKey: string;
    placeholder: string;
    hasRange?: boolean;
    rangeType?: string;
    noOptionsText?: string;
    hasCustomLogic?: boolean;
    getValues?: (
      product: import("@/app/types/product").Product,
      config: import("@/app/contexts/ProductContext").ProductConfiguration
    ) => any[];
  };

  const getConfigPatchForField = (
    field: ProductInputConfig,
    value: string | number | undefined
  ): Record<string, string | number> => {
    const patch: Record<string, string | number> = {
      [field.configKey]: value ?? "",
    };
    const isEmpty =
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "");
    if (field.pairedWith && isEmpty) {
      const pairedKey = PRODUCT_INPUT_TYPES.find(
        (f) => f.id === field.pairedWith
      )?.configKey;
      if (pairedKey) patch[pairedKey] = "";
    }
    return patch;
  };


  const asSelectValue = (v: unknown): string =>
    v === null || v === undefined || v === false ? "" : String(v);

  const asConfigArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

  const renderField = (
    fieldId: string,
    cidx: number,
    config: import("@/app/contexts/ProductContext").ProductConfiguration,
    currentProduct: import("@/app/types/product").Product
  ): React.ReactNode => {
    const field = PRODUCT_INPUT_TYPES.find((f) => f.id === fieldId);
    if (!field) return null;

    const fieldConfig = getInputConfig(field.id, cidx);
    const isInvalid =
      invalidFields[`${selectedIdx}-${cidx}-${field.validationKey}`];

    const renderInput = () => {
      const fieldType = field.type as ProductInputConfig["type"];

      if (fieldType === "number" && field.rangeType) {
        const range = getWidthHeightRange(currentProduct, config);
        const rangeType = field.rangeType;
        const minKey = `min${
          rangeType.charAt(0).toUpperCase() + rangeType.slice(1)
        }` as keyof typeof range;
        const maxKey = `max${
          rangeType.charAt(0).toUpperCase() + rangeType.slice(1)
        }` as keyof typeof range;
        const minValue = range[minKey] as number | undefined;
        const maxValue = range[maxKey] as number | undefined;
        const maxLength = 10;

        return (
          <div>
            <Input
              className={
                isInvalid
                  ? "border-red-500 dark:border-red-500 dark:bg-[#444] dark:text-white"
                  : "border-[#ccc] dark:border-[#555] dark:bg-[#444] dark:text-white"
              }
              placeholder={field.placeholder}
              type="number"
              min={1}
              maxLength={maxLength}
              value={asSelectValue(config[field.configKey])}
              onInput={(e) => {
                const input = e.target as HTMLInputElement;
                let val = input.value.replace(/[^0-9]/g, "");
                if (val.length > maxLength) val = val.slice(0, maxLength);

                const patch = getConfigPatchForField(field, val);
                updateConfiguration(selectedIdx, cidx, patch);
                setInvalidFields((prev) => {
                  const next = {
                    ...prev,
                    [`${selectedIdx}-${cidx}-${field.validationKey}`]: false,
                  };
                  if (field.pairedWith) {
                    const pairedValKey = PRODUCT_INPUT_TYPES.find(
                      (f) => f.id === field.pairedWith
                    )?.validationKey;
                    if (pairedValKey)
                      next[`${selectedIdx}-${cidx}-${pairedValKey}`] = false;
                  }
                  return next;
                });
              }}
              onBlur={(e) => {
                let val = e.target.value.replace(/[^0-9]/g, "");
                const patch = getConfigPatchForField(field, val);
                updateConfiguration(selectedIdx, cidx, patch);
              }}
            />
            {maxValue && (
              <p className="text-xs text-[#888] mt-2">
                * Powyżej <span className="font-bold">{maxValue}</span> mm -
                wycena indywidualna
              </p>
            )}
          </div>
        );
      }

      if (field.type === "number") {
        return (
          <Input
            className={
              isInvalid
                ? "border-red-500 dark:border-red-500 dark:bg-[#444] dark:text-white"
                : "border-[#ccc] dark:border-[#555] dark:bg-[#444] dark:text-white"
            }
            placeholder={field.placeholder}
            type="number"
            min={field.min ?? 0}
            step={field.step ?? 1}
            value={
              (config as Record<string, unknown>)[field.configKey] != null &&
              (config as Record<string, unknown>)[field.configKey] !== ""
                ? String((config as Record<string, unknown>)[field.configKey])
                : ""
            }
            onChange={(e) => {
              const patch = getConfigPatchForField(field, e.target.value);
              updateConfiguration(selectedIdx, cidx, patch);
              setInvalidFields((prev) => ({
                ...prev,
                [`${selectedIdx}-${cidx}-${field.validationKey}`]: false,
              }));
            }}
          />
        );
      }

      if (fieldType === "checkbox") {
        const getValues = field.getValues;
        const values = getValues ? getValues(currentProduct, config) : [];
        const selectedItems = asConfigArray(config[field.configKey]);
        const selectedStrings = selectedItems.filter(
          (v): v is string => typeof v === "string"
        );
        const selectedObjects = selectedItems.filter(
          (v): v is { name: string; quantity?: number } =>
            typeof v === "object" &&
            v !== null &&
            "name" in v &&
            typeof (v as { name: unknown }).name === "string"
        );

        return (
          <div className="space-y-3">
            {values.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-[#bbb]">
                {field.noOptionsText || "Brak opcji"}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {values.map((item: any) => {
                  const itemValue =
                    field.id === "ACCESSORIES_SINGLE" ? item : item.name;

                  return (
                    <label
                      key={itemValue}
                      className="flex items-center space-x-2 p-3 border rounded-lg bg-gray-50 dark:bg-[#444] dark:border-[#555] cursor-pointer select-none"
                      style={{
                        userSelect: "none",
                      }}
                    >
                      <Checkbox
                        checked={
                          field.id === "ACCESSORIES_SINGLE"
                            ? selectedStrings.includes(String(itemValue))
                            : selectedObjects.some(
                                (selected) => selected.name === itemValue
                              )
                        }
                        onCheckedChange={(checked) => {
                          const isChecked = Boolean(checked);
                          let newItems: unknown[];

                          if (field.id === "ACCESSORIES_SINGLE") {
                            newItems = isChecked
                              ? [...selectedStrings, String(itemValue)]
                              : selectedStrings.filter(
                                  (value) => value !== String(itemValue)
                                );
                          } else {
                            newItems = isChecked
                              ? [...selectedObjects, item]
                              : selectedObjects.filter(
                                  (selected) => selected.name !== itemValue
                                );
                          }

                          updateConfiguration(selectedIdx, cidx, {
                            [field.configKey]: newItems,
                          } as unknown as Partial<import("@/app/contexts/ProductContext").ProductConfiguration>);
                          setInvalidFields((prev) => ({
                            ...prev,
                            [`${selectedIdx}-${cidx}-${field.validationKey}`]:
                              false,
                          }));
                        }}
                        className="mt-[1px] data-[state=checked]:bg-mainTheme data-[state=checked]:border-mainTheme data-[state=checked]:text-white"
                      />
                      <span className="text-sm font-medium text-slate-800 dark:text-white flex-1">
                        {itemValue}
                      </span>
                      {field.id === "ACCESSORIES" && (
                        <span className="text-xs text-gray-500 dark:text-[#bbb]">
                          {item.quantity} szt
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      }

      if (field.type === "handle") {
        const getValues = field.getValues;
        const values: string[] = (
          getValues ? getValues(currentProduct, config) : []
        ).filter((v): v is string => typeof v === "string");
        const customAllowed = values.includes("__custom__");
        const filteredValues = values.filter((v) => !v.includes("__custom__"));
        const handleOptions = customAllowed
          ? filteredValues.includes("Własne")
            ? filteredValues
            : [...filteredValues, "Własne"]
          : filteredValues;

        return (
          <div className="flex gap-1 items-center">
            <Select
              value={(() => {
                const handleVal = asSelectValue(config.handle);
                if (handleOptions.includes(handleVal)) return handleVal;
                if (handleOptions.includes("Własne") && handleVal !== "")
                  return "Własne";
                return "";
              })()}
              onValueChange={(value) => {
                if (value === "Własne") {
                  updateConfiguration(selectedIdx, cidx, {
                    handle: "Własne",
                  });
                } else {
                  updateConfiguration(selectedIdx, cidx, {
                    handle: value,
                  });
                }
                setInvalidFields((prev) => ({
                  ...prev,
                  [`${selectedIdx}-${cidx}-${field.validationKey}`]: false,
                }));
              }}
              disabled={handleOptions.length === 0}
            >
              <SelectTrigger
                className={
                  isInvalid
                    ? "border-red-500 dark:border-red-500 dark:bg-[#444] dark:text-white"
                    : "border-[#ccc] dark:border-[#555] dark:bg-[#444] dark:text-white"
                }
              >
                <SelectValue
                  placeholder={
                    handleOptions.length === 0
                      ? "Brak dostępnych rączek"
                      : "Wybierz rączkę"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {handleOptions.length === 0 ? (
                  <SelectItem value="no-handles" disabled>
                    Brak dostępnych rączek
                  </SelectItem>
                ) : (
                  handleOptions.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value === "Własne" ? "Własne" : `${value} cm`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {config.handle === "Własne" && (
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="cm"
                className="ml-2 w-20 placeholder:text-sm placeholder:text-[#888] px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white bg-white dark:bg-[#444] dark:text-white border-[#ccc] dark:border-[#555]"
                value={asSelectValue(config.handleValue)}
                onChange={(e) => {
                  let val = e.target.value.replace(/[^0-9]/g, "");
                  if (val !== "") {
                    let num = parseInt(val, 10);
                    if (num > 240) num = 240;
                    val = num.toString();
                  }
                  updateConfiguration(selectedIdx, cidx, {
                    handle: "Własne",
                    handleValue: val,
                  });
                }}
                max={240}
                min={1}
                maxLength={3}
              />
            )}

            {config.handle && (
              <button
                type="button"
                onClick={() => {
                  updateConfiguration(selectedIdx, cidx, {
                    handle: "",
                    handleValue: "",
                  });
                  setInvalidFields((prev) => ({
                    ...prev,
                    [`${selectedIdx}-${cidx}-${field.validationKey}`]: false,
                  }));
                }}
                className="px-3 hover:text-mainTheme"
                title="Wyczyść rączkę"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      }

      if (fieldType === "select") {
        const getValues = field.getValues;
        const values: string[] = (
          getValues ? getValues(currentProduct, config) : []
        ).filter((v): v is string => typeof v === "string");

        if (field.id === "SYSTEM_COLOR") {
          const groupedValues: Record<string, string[]> = {};
          values.forEach((value: any) => {
            if (value.finish && value.color) {
              if (!groupedValues[value.finish]) {
                groupedValues[value.finish] = [];
              }
              groupedValues[value.finish].push(value.color);
            }
          });

          return (
            <div className="space-y-4 my-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {["anodowane", "mat", "pół-mat", "drewnopodobne", "RAL"]
                  .filter((finishType) => {
                    const colors = groupedValues[finishType] || [];
                    return colors.length > 0;
                  })
                  .map((finishType) => {
                    const colors = groupedValues[finishType] || [];
                    const currentValue = asSelectValue(config[field.configKey]);
                    const selectedColor =
                      currentValue && currentValue.startsWith(`${finishType}:`)
                        ? currentValue.split(":")[1]
                        : "";
                    const selectedCategory = currentValue
                      ? currentValue.split(":")[0]
                      : null;
                    const isSelectedCategory = selectedCategory === finishType;

                    return (
                      <div
                        key={finishType}
                        className={`space-y-2 transition-opacity ${
                          selectedCategory && !isSelectedCategory
                            ? "opacity-50"
                            : "opacity-100"
                        }`}
                      >
                        <label className="text-sm font-medium text-gray-700 dark:text-[#aaa] capitalize">
                          {finishType}
                        </label>
                        <Select
                          value={selectedColor}
                          onValueChange={(color) => {
                            const newValue = `${finishType}:${color}`;
                            updateConfiguration(selectedIdx, cidx, {
                              [field.configKey]: newValue,
                            });
                            setInvalidFields((prev) => ({
                              ...prev,
                              [`${selectedIdx}-${cidx}-${field.validationKey}`]:
                                false,
                            }));
                          }}
                        >
                          <SelectTrigger className="w-full border-[#ccc] dark:border-[#555] dark:bg-[#444] dark:text-white">
                            <SelectValue placeholder="Wybierz kolor" />
                          </SelectTrigger>
                          <SelectContent>
                            {colors.length > 0 ? (
                              colors.map((color) => (
                                <SelectItem key={color} value={color}>
                                  {color}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="px-2 py-1.5 text-sm text-[#888] dark:text-[#888]">
                                Brak opcji
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        }

        return (
          <div className="flex gap-1 items-center">
            <Select
              value={asSelectValue(config[field.configKey])}
              onValueChange={(value) => {
                updateConfiguration(selectedIdx, cidx, {
                  [field.configKey]: value,
                });
                setInvalidFields((prev) => ({
                  ...prev,
                  [`${selectedIdx}-${cidx}-${field.validationKey}`]: false,
                }));
              }}
            >
              <SelectTrigger
                className={
                  isInvalid
                    ? "border-red-500 dark:border-red-500 dark:bg-[#444] dark:text-white"
                    : "border-[#ccc] dark:border-[#555] dark:bg-[#444] dark:text-white"
                }
              >
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {values.length > 0 ? (
                  values.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-2 py-1.5 text-sm text-[#888] dark:text-[#888]">
                    {field.noOptionsText || "Brak opcji"}
                  </div>
                )}
              </SelectContent>
            </Select>

            {!fieldConfig?.required &&
              asSelectValue(config[field.configKey]) && (
                <button
                  type="button"
                  onClick={() => {
                    updateConfiguration(selectedIdx, cidx, {
                      [field.configKey]: "",
                    });
                    setInvalidFields((prev) => ({
                      ...prev,
                      [`${selectedIdx}-${cidx}-${field.validationKey}`]: false,
                    }));
                  }}
                  className="px-3 hover:text-mainTheme"
                  title={`Wyczyść ${field.label.toLowerCase()}`}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
          </div>
        );
      }

      return null;
    };

    return (
      <div key={field.id}>
        <Label className="text-slate-800 dark:text-white">
          {field.label}
          {(fieldConfig?.required || field.pairedWith) && (
            <span className="text-red-500 ml-1">
              {field.pairedWith
                ?
                  (() => {
                    const pairedKey = PRODUCT_INPUT_TYPES.find(
                      (f) => f.id === field.pairedWith
                    )?.configKey;
                    const value = (config as Record<string, any>)[
                      field.configKey
                    ];
                    const pairedValue = pairedKey
                      ? (config as Record<string, any>)[pairedKey]
                      : null;

                    const isEmpty = (val: any) => {
                      if (typeof val === "string")
                        return !val || val.trim() === "";
                      if (typeof val === "number") return false;
                      return !val;
                    };
                    return isEmpty(value) && isEmpty(pairedValue) ? "*" : "";
                  })()
                : "*"}
            </span>
          )}
        </Label>
        {renderInput()}
        {isInvalid && (
          <p className="text-red-500 dark:text-red-400 text-xs mt-1">
            Pole „{field.label}” jest wymagane.
          </p>
        )}
      </div>
    );
  };

  return (
    <div>
      <aside className="fixed left-0 top-0 w-[400px] h-[100dvh] bg-[#fafbfc] dark:bg-[#242424] border-r border-gray-200 dark:border-[#333] flex-col flex-shrink-0 z-0 hidden lg:flex">
        <header className="mt-[70px] px-4 pb-1 pt-[22px]">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <div className="flex justify-between items-center gap-2">
                <h1 className="font-bold text-slate-800 dark:text-white text-xl tracking-[0] leading-[30px]">
                  Szczegóły zamówienia
                </h1>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-mainTheme dark:bg-mainTheme hover:bg-mainThemeHover dark:hover:bg-mainThemeHover text-white w-[35px] p-2 h-[35px]">
                      <PlusIcon className="w-[40px] h-[40px]" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Wybierz produkt</DialogTitle>
                      <DialogDescription>
                        Wybierz produkt i jego wariant
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                      <div className="space-y-4">
                        <div>
                          <Label>Kategoria</Label>
                          <Select
                            value={selectedProduct}
                            onValueChange={(value) => {
                              setSelectedProduct(value);
                              setSelectedVariant("");
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Wybierz kategorię" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableProducts.map((category) => (
                                <SelectItem
                                  key={category.title}
                                  value={category.title}
                                >
                                  {categories.find(
                                    (c) => c.key === category.title
                                  )?.label || category.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Wariant</Label>
                          <Select
                            value={selectedVariant}
                            onValueChange={setSelectedVariant}
                            disabled={!selectedProduct}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Wybierz wariant" />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedProductData?.variants &&
                              selectedProductData.variants.length > 0 ? (
                                selectedProductData.variants.map((variant) => (
                                  <SelectItem
                                    key={variant.value}
                                    value={variant.label}
                                  >
                                    {variant.label}
                                  </SelectItem>
                                ))
                              ) : (
                                <div className="px-2 py-1.5 text-sm text-[#888] dark:text-[#888]">
                                  Brak produktów
                                </div>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="border-l pl-4">
                        <h3 className="font-medium mb-2">Wybrany produkt:</h3>
                        {selectedProduct && selectedVariant ? (
                          <div className="space-y-2">
                            <p className="text-sm text-mainTheme">
                              {selectedVariant}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-[#888]">
                            Tutaj pojawi sie wybrany produkt
                          </p>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="submit"
                        className="bg-mainTheme dark:bg-mainTheme hover:bg-mainThemeHover dark:hover:bg-mainThemeHover text-white"
                        onClick={handleAddProduct}
                        disabled={!selectedProduct || !selectedVariant}
                      >
                        Dodaj do zamówienia
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <input
                id="order-name-side"
                type="text"
                placeholder="Nazwa zlecenia (opcjonalnie)"
                value={orderName}
                onChange={(e) => setOrderName(e.target.value)}
                className="h-8 w-full text-sm bg-transparent border-0 border-b border-[#ccc] dark:border-[#555] rounded-none px-0 shadow-none outline-none focus:border-slate-500 dark:focus:border-[#777] text-slate-800 dark:text-white placeholder:text-muted-foreground mt-0 transition-colors"
              />
            </div>
          </div>
        </header>

        <div
          ref={asideListRef}
          className="flex-1 px-4 py-4 space-y-4 overflow-y-auto"
        >
          {products.map((product, idx) => {
            const productTotal = product.configurations.reduce(
              (sum, config) => {
                const dbProduct = fetchedProducts.find(
                  (p) => p.id === product.id
                );
                const price = dbProduct ? getConfigPrice(dbProduct, config) : 0;
                const configTotal = price * config.quantity;
                return sum + (isNaN(configTotal) ? 0 : configTotal);
              },
              0
            );
            return (
              <Card
                key={idx}
                ref={(el) => {
                  productCardRefs.current[idx] = el;
                }}
                className={
                  `w-[350px] cursor-pointer relative border-2 bg-white dark:bg-[#242424] transition-all duration-200 ` +
                  (selectedIdx === idx
                    ? "border-gray-500 dark:border-[#777]"
                    : "border-gray-200 dark:border-[#333]") +
                  (productSwitching && selectedIdx === idx ? " opacity-75" : "")
                }
                onClick={() => handleProductSelection(idx)}
              >
                <CardContent className="p-4 min-h-[110px] flex flex-col justify-center">
                  <div className="flex justify-between items-start mb-2">
                    <div className="mt-[2px] flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 dark:text-white text-base tracking-[0] leading-6 flex items-center gap-2">
                        <div className="flex-shrink-0">
                          {productSwitching && selectedIdx === idx ? (
                            <Loader2
                              className="text-mainTheme animate-spin mb-[1px]"
                              size={18}
                            />
                          ) : isProductValid(product) ? (
                            <SquareCheck
                              className="text-green-600 mb-[1px]"
                              size={18}
                            />
                          ) : (
                            <Square
                              className="text-red-400 mb-[1px]"
                              size={18}
                            />
                          )}
                        </div>
                        <span className="truncate overflow-hidden text-ellipsis whitespace-nowrap">
                          {product.variant}
                        </span>
                      </h3>
                      <p className="font-normal text-secondLight dark:text-secondDark text-xs tracking-[0] leading-[18px] mt-1 truncate overflow-hidden text-ellipsis whitespace-nowrap">
                        {categories.find((c) => c.key === product.category)
                          ?.label || product.category}
                      </p>
                    </div>
                    <Dialog
                      open={openDeleteIdx === idx}
                      onOpenChange={(open) =>
                        setOpenDeleteIdx(open ? idx : null)
                      }
                    >
                      <TooltipProvider>
                        <Tooltip delayDuration={0}>
                          <TooltipTrigger asChild>
                            <DialogTrigger asChild>
                              <button
                                className="pt-1 rounded hover:text-red-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDeleteIdx(idx);
                                }}
                              >
                                <Trash2 size={18} />
                              </button>
                            </DialogTrigger>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Usuń produkt</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            Czy na pewno chcesz usunąć ten produkt?
                          </DialogTitle>
                          <DialogDescription>
                            Wszystkie konfiguracje zostaną usunięte.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button
                            variant="destructive"
                            onClick={() => {
                              removeProduct(idx);
                              setOpenDeleteIdx(null);
                              if (idx === selectedIdx) {
                                if (products.length > 1) {
                                  setSelectedIdx(idx > 0 ? idx - 1 : 0);
                                }
                              } else if (idx < selectedIdx) {
                                setSelectedIdx(selectedIdx - 1);
                              }
                            }}
                          >
                            Usuń
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="flex justify-between items-center h-[20px]">
                    <span className="text-sm text-slate-800 dark:text-white">
                      Ilość konfiguracji:{" "}
                      <span className="text-mainTheme dark:text-mainThemeLight">
                        [{product.configurations.length}]
                      </span>
                    </span>
                    <span className="font-semibold text-black dark:text-white max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap block">
                      {(() => {
                        const isThisProductLoading =
                          product.configurations.some((_, configIdx) => {
                            const configKey = `${idx}-${configIdx}`;
                            return loadingConfigs.has(configKey);
                          });

                        if (isThisProductLoading || productDataLoading) {
                          return (
                            <div className="flex items-center justify-end min-w-[60px]">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          );
                        }

                        const dbProductForCard = fetchedProducts.find(
                          (p) => p.id === product.id
                        );
                        const hasAnyConfigIndividualQuote =
                          !dbProductForCard?.pricingTemplate?.id ||
                          product.configurations.some(
                            (config) =>
                              dbProductForCard &&
                              needsCustomPricing(dbProductForCard, config)
                          );

                        const showPrice =
                          !hasAnyConfigIndividualQuote || productTotal !== 0;
                        const displayPrice = isNaN(productTotal)
                          ? "0.00"
                          : productTotal.toFixed(2);

                        return (
                          <div className="flex items-center justify-end gap-[1px]">
                            {showPrice && (
                              <>
                                <span className="font-semibold mr-[3px] text-black dark:text-white">
                                  {displayPrice}
                                </span>
                                <span className="text-xs font-normal">zł</span>
                              </>
                            )}
                            {hasAnyConfigIndividualQuote && (
                              <IndividualQuoteTooltip
                                variant={productTotal === 0 ? "single" : "sum"}
                                className="ml-[4px] pb-[2px]"
                              />
                            )}
                          </div>
                        );
                      })()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <footer className="bg-white dark:bg-[#222] border-t border-gray-200 dark:border-[#333] px-7 pt-5 pb-7 sticky bottom-0 z-10">
          <div className="mb-4 flex justify-between items-center">
            <span className="font-semibold text-slate-800 dark:text-white text-base tracking-[0] leading-6">
              Łączna wycena:
            </span>
            <div className="flex items-center gap-2 justify-center h-[30px]">
              <span className="font-semibold text-black dark:text-white text-xl leading-[30px] tracking-[0]">
                {(() => {
                  const isAnyConfigLoading = products.some(
                    (product, productIdx) => {
                      return product.configurations.some((_, configIdx) => {
                        const configKey = `${productIdx}-${configIdx}`;
                        return loadingConfigs.has(configKey);
                      });
                    }
                  );

                  if (isAnyConfigLoading || productDataLoading) {
                    return (
                      <div className="flex items-center h-full gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    );
                  }

                  const hasAnyIndividualQuote = products.some((product) => {
                    const dbProduct = fetchedProducts.find(
                      (p) => p.id === product.id
                    );
                    return (
                      !dbProduct?.pricingTemplate?.id ||
                      product.configurations.some(
                        (config) =>
                          dbProduct && needsCustomPricing(dbProduct, config)
                      )
                    );
                  });

                  const showTotalPrice =
                    !hasAnyIndividualQuote || calculateTotalPrice !== 0;
                  const totalDisplay = isNaN(calculateTotalPrice)
                    ? "0.00"
                    : calculateTotalPrice.toFixed(2);

                  return (
                    <>
                      {showTotalPrice && (
                        <>
                          {totalDisplay}{" "}
                          <span className="text-sm font-normal">zł</span>
                        </>
                      )}
                    </>
                  );
                })()}
              </span>
              {products.some((product) => {
                const dbProduct = fetchedProducts.find(
                  (p) => p.id === product.id
                );
                return (
                  !dbProduct?.pricingTemplate?.id ||
                  product.configurations.some(
                    (config) =>
                      dbProduct && needsCustomPricing(dbProduct, config)
                  )
                );
              }) && (
                <IndividualQuoteTooltip
                  variant={calculateTotalPrice === 0 ? "single" : "sum"}
                />
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <span className="w-full">
                    <Button
                      className="w-full h-10 bg-mainTheme dark:bg-mainTheme hover:bg-mainThemeHover dark:hover:bg-mainThemeHover text-white"
                      disabled={!isAllProductsValid()}
                      onClick={() => setOpenAddToCartConfirm(true)}
                    >
                      <span className="font-medium text-sm">
                        {editId ? "Zapisz zmiany" : "Dodaj do koszyka"}
                      </span>
                    </Button>
                  </span>
                </TooltipTrigger>
                {!isAllProductsValid() && (
                  <TooltipContent>
                    <p>Uzupełnij wszystkie wymagane pola</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </footer>
      </aside>

      <main className="lg:ml-[400px] flex flex-col bg-[#fcfcfc] dark:bg-[#1c1c1c] px-3 sm:px-8 md:px-8 min-h-[calc(100vh-60px)] lg:pt-0">
        {products.length === 0 ? (
          editId ? (
            <div className="pt-16 flex flex-col items-center justify-center gap-4">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
              <p className="text-panel-textMuted text-sm">
                Ładowanie zamówienia z koszyka...
              </p>
            </div>
          ) : (
            <div className="pt-16 text-center text-gray-400">
              Brak wybranych produktów
            </div>
          )
        ) : initialLoading || productDataLoading ? (
          <div className="pt-16">
            <div className="flex flex-col gap-4">
              {Array.from({ length: 2 }).map((_, idx) => (
                <div
                  key={`initial-skeleton-${idx}`}
                  className="border rounded-lg p-6 mb-4 relative bg-white shadow-lg dark:bg-[#333] dark:border-[#444]"
                >
                  <div className="flex items-center mb-4">
                    <div className="animate-pulse bg-gray-300 dark:bg-[#555] h-6 w-32 rounded"></div>
                    <div className="flex items-center gap-2 ml-2">
                      <div className="animate-pulse bg-gray-300 dark:bg-[#555] h-6 w-6 rounded"></div>
                      <div className="animate-pulse bg-gray-300 dark:bg-[#555] h-6 w-6 rounded"></div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="animate-pulse bg-gray-300 dark:bg-[#555] h-10 w-full rounded"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="animate-pulse bg-gray-300 dark:bg-[#555] h-10 w-full rounded"></div>
                      <div className="animate-pulse bg-gray-300 dark:bg-[#555] h-10 w-full rounded"></div>
                    </div>
                    <div className="animate-pulse bg-gray-300 dark:bg-[#555] h-20 w-full rounded"></div>
                  </div>
                  <div className="mt-5 pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <div className="animate-pulse bg-gray-300 dark:bg-[#555] h-6 w-16 rounded"></div>
                      <div className="animate-pulse bg-gray-300 dark:bg-[#555] h-6 w-20 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <header className="sm:pt-[16px] flex justify-center mb-2 lg:mb-0 lg:justify-between items-center">
              <div className="flex flex-col items-center sm:flex-row sm:justify-between w-full gap-2 sm:gap-8 lg:gap-2">
                <div className="text-center sm:text-start">
                  {productSwitching ? (
                    <>
                      <div className="animate-pulse bg-gray-300 dark:bg-[#555] h-8 w-48 rounded mb-2"></div>
                      <div className="animate-pulse bg-gray-300 dark:bg-[#555] h-4 w-32 rounded"></div>
                    </>
                  ) : (
                    <>
                      <h1 className="font-bold text-slate-800 dark:text-white sm:text-lg xl:text-xl tracking-[0] my-2">
                        {products[selectedIdx]?.variant}
                      </h1>
                      <p className="font-normal text-secondLight dark:text-secondDark text-sm tracking-[0]">
                        {categories.find(
                          (c) => c.key === products[selectedIdx]?.category
                        )?.label || products[selectedIdx]?.category}
                      </p>
                    </>
                  )}
                </div>
                <Button
                  className="bg-mainTheme dark:bg-mainTheme hover:bg-mainThemeHover dark:hover:bg-mainThemeHover text-white w-full sm:w-auto mt-2"
                  onClick={handleAddConfiguration}
                  disabled={productSwitching}
                >
                  Dodaj konfigurację
                </Button>
              </div>
            </header>
            <div className="py-2 sm:py-4 flex-1 flex flex-col mb-3">
              {productsError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                  {productsError}
                </div>
              )}
              <div className="w-full mb-2">
                <div className="flex flex-col gap-4">

                  {(() => {
                    const configsToRender =
                      products[selectedIdx]?.configurations || [];
                    const currentProduct = fetchedProducts.find(
                      (p) => p.id === products[selectedIdx]?.id
                    );

                    if (!currentProduct) {
                      if (productDataLoading) {
                        return (
                          <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
                            <p className="text-panel-textMuted text-sm">
                              Ładowanie danych produktu...
                            </p>
                          </div>
                        );
                      }
                      return (
                        <div className="text-destructive text-sm py-4">
                          Nie znaleziono produktu (ID:{" "}
                          {products[selectedIdx]?.id ?? "—"}). Sprawdź, czy
                          produkt nadal istnieje w ofercie.
                          {productsError ? ` ${productsError}` : ""}
                        </div>
                      );
                    }

                    if (productSwitching) {
                      return Array.from({ length: 2 }).map((_, idx) => (
                        <div
                          key={`skeleton-${idx}`}
                          className="border rounded-lg p-6 mb-4 relative bg-white shadow-lg dark:bg-[#333] dark:border-[#444]"
                        >
                          <div className="flex items-center mb-4">
                            <div className="animate-pulse bg-gray-300 dark:bg-[#555] h-6 w-32 rounded"></div>
                            <div className="flex items-center gap-2 ml-2">
                              <div className="animate-pulse bg-gray-300 dark:bg-[#555] h-6 w-6 rounded"></div>
                              <div className="animate-pulse bg-gray-300 dark:bg-[#555] h-6 w-6 rounded"></div>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div className="animate-pulse bg-gray-300 dark:bg-[#555] h-10 w-full rounded"></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="animate-pulse bg-gray-300 dark:bg-[#555] h-10 w-full rounded"></div>
                              <div className="animate-pulse bg-gray-300 dark:bg-[#555] h-10 w-full rounded"></div>
                            </div>
                            <div className="animate-pulse bg-gray-300 dark:bg-[#555] h-20 w-full rounded"></div>
                          </div>
                          <div className="mt-5 pt-3 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                              <div className="animate-pulse bg-gray-300 dark:bg-[#555] h-6 w-16 rounded"></div>
                              <div className="animate-pulse bg-gray-300 dark:bg-[#555] h-6 w-20 rounded"></div>
                            </div>
                          </div>
                        </div>
                      ));
                    }

                    return configsToRender.map((config, cidx) => {
                      const configInputs = configInputsList[cidx];

                      const configInvalidFields = Object.keys(invalidFields)
                        .filter((key) =>
                          key.startsWith(`${selectedIdx}-${cidx}-`)
                        )
                        .reduce(
                          (obj, key) => ({
                            ...obj,
                            [key]: invalidFields[key],
                          }),
                          {}
                        );

                      return (
                        <ConfigurationItem
                          key={`config-${selectedIdx}-${cidx}`}
                          config={config}
                          configIndex={cidx}
                          selectedIdx={selectedIdx}
                          currentProduct={currentProduct}
                          configInputs={configInputs}
                          productDataLoading={productDataLoading}
                          priceLoading={priceLoading}
                          loadingConfigs={loadingConfigs}
                          fetchedProducts={fetchedProducts}
                          products={products}
                          invalidFields={configInvalidFields}
                          updateConfiguration={stableUpdateConfiguration}
                          removeConfiguration={stableRemoveConfiguration}
                          setInvalidFields={stableSetInvalidFields}
                          handleDuplicate={handleDuplicate}
                          getConfigPrice={getConfigPrice}
                          needsCustomPricing={needsCustomPricing}
                          renderField={renderField}
                          PRODUCT_INPUT_TYPES={PRODUCT_INPUT_TYPES}
                          configRefs={configRefs}
                        />
                      );
                    });
                  })()}
                </div>
              </div>
              <div ref={bottomRef} />
              <div className="flex justify-end gap-4">
                {selectedIdx > 0 && (
                  <Button
                    variant="outline"
                    className="px-8"
                    onClick={() => {
                      handleProductSelection(selectedIdx - 1);
                    }}
                    disabled={productSwitching}
                  >
                    Wróć
                  </Button>
                )}
                {selectedIdx < products.length - 1 ? (
                  <Button
                    className="px-8"
                    onClick={() => {
                      if (validateCurrentProduct()) {
                        if (selectedIdx < products.length - 1) {
                          handleProductSelection(selectedIdx + 1);
                        }
                      }
                    }}
                    disabled={productSwitching}
                  >
                    Dalej
                  </Button>
                ) : (
                  <Button
                    className="px-8 bg-mainTheme dark:bg-mainTheme hover:bg-mainThemeHover dark:hover:bg-mainThemeHover text-white"
                    disabled={productSwitching || isAddingToCart}
                    onClick={() => {
                      if (validateAllProducts()) {
                        setOpenAddToCartConfirm(true);
                      }
                    }}
                  >
                    {isAddingToCart ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editId ? "Zapisywanie..." : "Dodawanie..."}
                      </>
                    ) : (
                      "Podsumowanie"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </main>
      <Dialog
        open={openAddToCartConfirm}
        onOpenChange={setOpenAddToCartConfirm}
      >
        <DialogContent className="max-w-[450px] py-6 px-6">
          <DialogHeader className="pb-2">
            <DialogTitle className="pr-10">
              {editId
                ? "Czy na pewno chcesz zapisać zmiany?"
                : "Czy na pewno chcesz kontynuować?"}
            </DialogTitle>
            <DialogDescription asChild>
              <span className="block text-xs text-muted-foreground pt-2 pb-1">
                Możliwa jest późniejsza edycja z poziomu koszyka.
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpenAddToCartConfirm(false)}
            >
              Anuluj
            </Button>
            <Button
              className="bg-mainTheme dark:bg-mainTheme hover:bg-mainThemeHover dark:hover:bg-mainThemeHover text-white"
              onClick={() => {
                setOpenAddToCartConfirm(false);
                handleAddToCart();
              }}
              disabled={isAddingToCart}
            >
              {editId ? "Zapisz zmiany" : "Dodaj do koszyka"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
