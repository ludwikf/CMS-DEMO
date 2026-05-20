"use client";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { Combobox } from "@/components/ui/combobox";
import { useSession } from "next-auth/react";
import { X, Minus, Plus, Trash, ChevronUp, ChevronDown } from "lucide-react";
import { useProductContext } from "@/app/contexts/ProductContext";
import Link from "next/link";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { categories, getCategoryLabel } from "@/lib/productCategories";
import { createConfigurationFromProduct } from "@/app/contexts/ProductContext";

function NewOrderContent() {
  const { data: session } = useSession();
  const {
    fetchedProducts,
    loadingProducts,
    productsError,
    fetchProducts,
    products: orderItems,
    addProduct,
    setProducts,
    setProductQuantity,
    updateConfiguration,
    removeConfiguration,
    addDefaultConfiguration,
    availableProducts,
  } = useProductContext();
  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const [selectedVariants, setSelectedVariants] = useState<
    (string | undefined)[]
  >(Array(categories.length).fill(undefined));
  const orderListRef = React.useRef<HTMLUListElement>(null);
  const orderItemRefs = React.useRef<(HTMLLIElement | null)[]>([]);
  const [lastChangedIndex, setLastChangedIndex] = React.useState<number | null>(
    null
  );
  const prevOrderLength = React.useRef(orderItems.length);
  const [lastHighlightedIndex, setLastHighlightedIndex] = React.useState<
    number | null
  >(null);

  React.useEffect(() => {
    if (lastChangedIndex !== null && orderItemRefs.current[lastChangedIndex]) {
      orderItemRefs.current[lastChangedIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
    prevOrderLength.current = orderItems.length;
  }, [orderItems, lastChangedIndex]);

  React.useEffect(() => {
    if (lastHighlightedIndex !== null) {
      const timeout = setTimeout(() => setLastHighlightedIndex(null), 700);
      return () => clearTimeout(timeout);
    }
  }, [lastHighlightedIndex]);

  const handleSelect = (index: number, value: string) => {
    setSelectedVariants((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleAddToOrder = (catIdx: number) => {
    const selectedProductId = selectedVariants[catIdx];
    if (!selectedProductId) return;
    const product = fetchedProducts.find((p) => p.id === selectedProductId);
    if (!product) return;

    const existingIdx = orderItems.findIndex(
      (item) => item.id === product.id && item.variant === product.variant
    );
    if (existingIdx !== -1) {
      setLastChangedIndex(existingIdx);
      setLastHighlightedIndex(existingIdx);
      orderItemRefs.current[existingIdx]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      setSelectedVariants((prev) => {
        const updated = [...prev];
        updated[catIdx] = undefined;
        return updated;
      });
      return;
    }

    const config = createConfigurationFromProduct(product);

    addProduct({
      id: product.id,
      variant: product.variant,
      category: product.category,
      quantity: 1,
      configurations: [config],
    });
    const newIdx = orderItems.length;
    setTimeout(() => {
      setLastChangedIndex(newIdx);
      setLastHighlightedIndex(newIdx);
      orderItemRefs.current[newIdx]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 0);
    setSelectedVariants((prev) => {
      const updated = [...prev];
      updated[catIdx] = undefined;
      return updated;
    });
  };

  const handleQuantityChange = (idx: number, newQuantity: number) => {
    setProductQuantity(idx, newQuantity);
    setLastChangedIndex(idx);
    setLastHighlightedIndex(idx);
  };

  const handleDeleteOrderItem = (idx: number) => {
    setProducts(orderItems.filter((_, i) => i !== idx));
  };

  return (
    <div className="w-full min-w-0 flex flex-col items-center px-4 sm:px-12">
      <div className="w-full min-w-0 sm:mt-8 mb-10">
        <div className="hidden sm:flex flex-col gap-1">
          <div className="text-xl lg:text-3xl font-bold">Nowe zamówienie</div>
          <div className="text-secondLight dark:text-secondDark text-sm lg:text-base">
            Wybierz produkty i dodaj je do zamówienia
          </div>
        </div>
        {productsError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            {productsError}
          </div>
        )}
        <div className="mt-5 gap-6 flex flex-col lg:flex-row lg:items-stretch w-full min-w-0 overflow-hidden">
          <div className="w-full lg:flex-1 lg:min-w-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {availableProducts.map((cat, idx) => (
              <div
                key={cat.title}
                className="w-full min-w-[220px] sm:min-w-[240px] shadow-lg flex flex-col gap-2 p-4 rounded-xl border-[1px] dark:border-[#333] bg-white dark:bg-[#242424] stable-layout"
              >
                <div className="font-semibold sm:text-xl mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getCategoryLabel(cat.title)}
                    {(() => {
                      const testProducts = cat.variants.filter((variant) => {
                        const product = fetchedProducts.find(
                          (p) => p.id === variant.value
                        );
                        return product?.status === "TEST";
                      });
                      const testCount = testProducts.length;

                      return testCount > 0 ? (
                        <TooltipProvider>
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                              <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 rounded-full cursor-default">
                                TEST
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="bg-yellow-50 dark:bg-yellow-900/50 border-yellow-200 dark:border-yellow-700">
                              <div className="text-xs">
                                <div className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                                  Produkty testowe:
                                </div>
                                {testProducts.map((variant, idx) => (
                                  <div
                                    key={idx}
                                    className="text-yellow-700 dark:text-yellow-300"
                                  >
                                    • {variant.label}
                                  </div>
                                ))}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : null;
                    })()}
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    className={`ml-2 flex sm:hidden mobile-safe prevent-zoom stable-layout ${
                      !selectedVariants[idx]
                        ? "bg-gray-300 text-[#444] cursor-default dark:bg-[#2A2A2A] dark:text-[#666]"
                        : "bg-mainTheme dark:bg-mainTheme hover:bg-mainThemeHover dark:hover:bg-mainThemeHover text-white"
                    }`}
                    disabled={!selectedVariants[idx]}
                    onClick={() => handleAddToOrder(idx)}
                    aria-label="Dodaj do zamówienia"
                  >
                    <Plus size={18} />
                  </Button>
                </div>
                <div className="text-secondLight text-sm hidden sm:block">
                  Wybierz wariant
                </div>
                <div className="w-full">
                  {loadingProducts ? (
                    <Combobox
                      value={undefined}
                      setValue={() => {}}
                      options={[]}
                      placeholder={
                        (
                          <span className="flex items-center w-full">
                            <Skeleton className="h-6 w-full bg-[#f1f1f1] rounded-lg" />
                          </span>
                        ) as any
                      }
                      hideSearchInput
                      disabled={true}
                    />
                  ) : (
                    <Combobox
                      value={selectedVariants[idx]}
                      setValue={(val) => handleSelect(idx, val)}
                      options={cat.variants}
                    />
                  )}
                </div>
                <Button
                  className={`mt-4 hidden sm:block mobile-safe prevent-zoom stable-layout ${
                    !selectedVariants[idx]
                      ? "bg-gray-300 text-[#444] cursor-default dark:bg-[#2A2A2A] dark:text-[#666]"
                      : "bg-mainTheme dark:bg-mainTheme hover:bg-mainThemeHover dark:hover:bg-mainThemeHover text-white"
                  }`}
                  disabled={!selectedVariants[idx]}
                  onClick={() => handleAddToOrder(idx)}
                >
                  Dodaj do zamówienia
                </Button>
              </div>
            ))}
          </div>


          <div className="w-full mt-2 lg:mt-0 lg:w-[38%] lg:min-w-[300px] lg:max-w-[530px] shadow-lg flex flex-col gap-2 p-5 rounded-xl bg-white dark:bg-[#242424]">
            <div className="flex justify-between items-center gap-4 sm:gap-0">
              <div className="flex flex-col">
                <div className="text-sm sm:text-lg font-semibold">
                  Zamówienie
                </div>
                <div className="text-secondLight text-sm hidden sm:block">
                  Konfiguracje do danego produktu
                </div>
              </div>
              <div className="flex gap-2">
                {orderItems.length > 0 ? (
                  <Button
                    asChild
                    className="bg-mainTheme dark:bg-mainTheme hover:bg-mainThemeHover dark:hover:bg-mainThemeHover text-white select-none"
                  >
                    <Link href={"/nowe-zamowienie/zamowienie"}>Kontynuuj</Link>
                  </Button>
                ) : (
                  <Button
                    className="bg-mainTheme dark:bg-mainTheme text-white opacity-50 cursor-not-allowed select-none"
                    disabled
                  >
                    Kontynuuj
                  </Button>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {orderItems.length === 0 ? (
                <div className="flex flex-col gap-1 h-full items-center py-10">
                  <div className="text-[#666] dark:text-secondDark text-center text-sm sm:text-base">
                    Jeszcze nic nie dodałeś do zamówienia
                  </div>
                  <div className="hidden sm:block text-sm text-[#999] text-center">
                    Wybierz produkty powyżej, aby dodać je do zamówienia
                  </div>
                </div>
              ) : (
                <ul
                  ref={orderListRef}
                  className="flex flex-col gap-5 w-full mt-4 max-h-[350px] overflow-y-auto"
                >
                  {orderItems.map((item, i) => (
                    <div className="flex flex-col gap-2" key={i}>

                      <li
                        ref={(el) => {
                          orderItemRefs.current[i] = el;
                        }}
                        className={`flex flex-row items-center justify-between border-[1px] sm:items-center px-5 py-3 rounded-xl text-sm gap-2
                        ${
                          lastHighlightedIndex === i
                            ? "dark:bg-[#4d4d4d] bg-[#ececec]"
                            : "dark:bg-[#343434] bg-[#f6f6f6]"
                        }
                        transition-colors duration-700`}
                      >
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-[13px] sm:text-[15px]">
                            {item.variant}
                          </span>
                          <span className="text-secondLight dark:text-[#999] text-xs sm:text-sm">
                            {getCategoryLabel(item.category)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between sm:justify-normal sm:w-auto gap-5 h-full">
                          <div className="relative h-[44px] hidden sm:flex flex-col items-center">
                            <input
                              type="number"
                              min={1}
                              max={99}
                              value={
                                item.quantity ? String(item.quantity) : "1"
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "" || isNaN(Number(val))) return;
                                handleQuantityChange(
                                  i,
                                  Math.max(1, Math.min(99, Number(val)))
                                );
                              }}
                              onFocus={(e) => e.target.select()}
                              className="w-[70px] h-full pl-1 px-2 py-1 border rounded-lg text-center focus:outline-none focus:ring-1 focus:ring-mainTheme pr-8"
                              title="Ilość"
                            />
                            <div className="absolute border-l-2 pl-1 right-1 top-1 flex flex-col h-[calc(100%-0.5rem)] justify-between">
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="w-5 h-5 p-0"
                                onClick={() =>
                                  handleQuantityChange(
                                    i,
                                    Math.min(99, item.quantity + 1)
                                  )
                                }
                                aria-label="Zwiększ ilość"
                              >
                                <ChevronUp size={14} />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="w-5 h-5 p-0"
                                onClick={() =>
                                  handleQuantityChange(
                                    i,
                                    Math.max(1, item.quantity - 1)
                                  )
                                }
                                disabled={item.quantity <= 1}
                                aria-label="Zmniejsz ilość"
                              >
                                <ChevronDown size={14} />
                              </Button>
                            </div>
                          </div>
                          <button
                            className="sm:ml-2 p-1 rounded hover:text-red-600"
                            title="Usuń"
                            onClick={() => handleDeleteOrderItem(i)}
                          >
                            <Trash size={17} />
                          </button>
                        </div>
                      </li>

                      {item.configurations.map((config, cidx) =>
                        cidx === 0 ? null : (
                          <div className="flex w-full" key={cidx}>
                            <div>
                              <div className="w-[50px] h-[50px] relative">
                                <div className="absolute right-0 top-0 w-[30px] h-[30px] border-b-2 border-l-2 border-[#ccc]"></div>
                              </div>
                            </div>
                            <div
                              className={`w-full ml-1 flex flex-col sm:flex-row justify-between border-[1px] sm:items-center px-5 py-3 rounded-xl text-sm gap-2
                            ${
                              lastHighlightedIndex === i
                                ? "dark:bg-[#4d4d4d] bg-[#ececec]"
                                : "dark:bg-[#343434] bg-[#f6f6f6]"
                            }
                            transition-colors duration-700`}
                            >
                              <div className="flex flex-col gap-1">
                                <span>
                                  Konfiguracja{" "}
                                  <span className="text-mainTheme">
                                    [{cidx + 1}]
                                  </span>
                                </span>
                              </div>
                              <button
                                className="ml-2 p-1 rounded hover:text-red-600"
                                title="Usuń konfigurację"
                                onClick={() => removeConfiguration(i, cidx)}
                              >
                                <Trash size={17} />
                              </button>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewOrderContent;
