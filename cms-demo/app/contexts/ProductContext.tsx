"use client";
import {
  createContext,
  ReactNode,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { Product as DBProduct } from "@/app/types/product";
import { PRODUCT_INPUT_TYPES } from "@/app/contexts/inputTypes";

export type ProductVariant = {
  value: string;
  label: string;
};

export type ProductType = {
  title: string;
  variants: ProductVariant[];
};

export type ProductConfiguration = {
  width?: string;
  height?: string;
  color?: string;
  model?: string;
  quantity: number;
  subvariant?: string;
  price?: number;
  note?: string;
  needsIndividualQuote?: boolean;
  [key: string]: string | number | boolean | undefined;
};

export type CartProduct = {
  id: string;
  category: DBProduct["category"];
  variant: DBProduct["variant"];
  configurations: ProductConfiguration[];
  quantity: number;
  variantLabel?: string;
};

export type ProductContextType = {
  products: CartProduct[];
  fetchedProducts: DBProduct[];
  addProduct: (product: CartProduct) => void;
  removeProduct: (index: number) => void;
  addConfiguration: (
    productIndex: number,
    config: ProductConfiguration
  ) => void;
  updateConfiguration: (
    productIndex: number,
    configIndex: number,
    updates: Partial<ProductConfiguration>
  ) => void;
  removeConfiguration: (productIndex: number, configIndex: number) => void;
  setProducts: (products: CartProduct[]) => void;
  setProductQuantity: (productIdx: number, newQuantity: number) => void;
  availableProducts: ProductType[];
  fetchProducts: () => Promise<void>;
  loadingProducts: boolean;
  productsError: string | null;
  priceLoading: boolean;
  setPriceLoading: (loading: boolean) => void;
  addDefaultConfiguration: (productIdx: number) => void;
  syncQuantityWithConfigurations: (productIdx: number) => void;
  validateProductQuantities: (products: CartProduct[]) => CartProduct[];
};

export const ProductContext = createContext<ProductContextType>({
  products: [],
  fetchedProducts: [],
  addProduct: () => {},
  removeProduct: () => {},
  addConfiguration: () => {},
  updateConfiguration: () => {},
  removeConfiguration: () => {},
  setProducts: () => {},
  setProductQuantity: () => {},
  availableProducts: [],
  fetchProducts: async () => {},
  loadingProducts: false,
  productsError: null,
  priceLoading: false,
  setPriceLoading: () => {},
  addDefaultConfiguration: () => {},
  syncQuantityWithConfigurations: () => {},
  validateProductQuantities: () => [],
});

import { categories, normalizeCategoryKey } from "@/lib/productCategories";
export { categories, getCategoryLabel } from "@/lib/productCategories";

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<CartProduct[]>([]);
  const [fetchedProducts, setFetchedProducts] = useState<DBProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const fetchProductsPromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    if (products.length > 0) {
      const validatedProducts = validateProductQuantities(products);
      const hasChanges = validatedProducts.some(
        (validated, index) => validated.quantity !== products[index].quantity
      );
      if (hasChanges) {
        setProducts(validatedProducts);
      }
    }
  }, [products.map((p) => p.configurations.length).join(",")]);

  const addProduct = (product: CartProduct) => {
    setProducts((prev) => {
      const idx = prev.findIndex(
        (p) => p.id === product.id && p.variant === product.variant
      );

      if (idx !== -1) {
        const updatedProduct = { ...prev[idx] };
        product.configurations.forEach((newConfig) => {
          if (
            !updatedProduct.configurations.some(
              (existingConfig) =>
                JSON.stringify(existingConfig) === JSON.stringify(newConfig)
            )
          ) {
            updatedProduct.configurations.push(newConfig);
          }
        });
        updatedProduct.quantity = updatedProduct.configurations.length;
        const newProducts = [...prev];
        newProducts[idx] = updatedProduct;
        return newProducts;
      }
      return [...prev, { ...product, quantity: product.configurations.length }];
    });
  };

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, idx) => idx !== index));
  };

  const addConfiguration = (
    productIdx: number,
    config: ProductConfiguration
  ) => {
    setProducts((prev) =>
      prev.map((p, i) =>
        i === productIdx
          ? {
              ...p,
              configurations: [...p.configurations, config],
              quantity: Math.max(1, p.configurations.length + 1),
            }
          : p
      )
    );
  };

  const updateConfiguration = (
    productIdx: number,
    configIdx: number,
    config: Partial<ProductConfiguration>
  ) => {
    setProducts((prev) =>
      prev.map((p, i) =>
        i === productIdx
          ? {
              ...p,
              configurations: p.configurations.map((c, j) =>
                j === configIdx ? { ...c, ...config } : c
              ),
            }
          : p
      )
    );
  };

  const removeConfiguration = (productIdx: number, configIdx: number) => {
    setProducts((prev) =>
      prev.map((p, i) => {
        if (i !== productIdx) return p;
        if (p.configurations.length <= 1) {
          return p;
        }

        const newConfigs = p.configurations.filter((_, j) => j !== configIdx);
        const newQuantity = Math.max(1, newConfigs.length);

        return {
          ...p,
          configurations: newConfigs,
          quantity: newQuantity,
        };
      })
    );
  };

  const syncQuantityWithConfigurations = (productIdx: number) => {
    setProducts((prev) =>
      prev.map((p, i) =>
        i === productIdx
          ? { ...p, quantity: Math.max(1, p.configurations.length) }
          : p
      )
    );
  };

  const setProductQuantity = (productIdx: number, newQuantity: number) => {
    const validQuantity = Math.max(1, Math.min(99, newQuantity));

    setProducts((prev) =>
      prev.map((p, i) => {
        if (i !== productIdx) return p;
        let configs = [...p.configurations];
        if (validQuantity > configs.length) {
          for (let j = configs.length; j < validQuantity; j++) {
            const dbProduct = fetchedProducts.find((prod) => prod.id === p.id);
            if (!dbProduct) continue;

            const config = createConfigurationFromProduct(dbProduct);

            configs.push(config);
          }
        } else if (validQuantity < configs.length) {
          configs = configs.slice(0, validQuantity);
        }
        const finalQuantity = Math.max(1, configs.length);

        return { ...p, quantity: finalQuantity, configurations: configs };
      })
    );
  };

  const validateProductQuantities = (productsToValidate: CartProduct[]) => {
    return productsToValidate.map((product) => ({
      ...product,
      quantity: Math.max(1, product.configurations.length),
    }));
  };

  const fetchProducts = useCallback(async () => {
    if (fetchProductsPromiseRef.current) {
      return fetchProductsPromiseRef.current;
    }

    const request = (async () => {
      setLoadingProducts(true);
      setProductsError(null);
      try {
        const res = await fetch("/api/user/products");
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          const errorMessage =
            typeof data?.error === "string"
              ? data.error
              : "Nie udało się załadować produktów.";
          throw new Error(errorMessage);
        }

        if (!Array.isArray(data)) {
          throw new Error("API zwróciło nieprawidłową listę produktów.");
        }

        setFetchedProducts(data);

        setProducts((prev) => validateProductQuantities(prev));
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Nie udało się załadować produktów.";
        setProductsError(errorMessage);
      } finally {
        setLoadingProducts(false);
        fetchProductsPromiseRef.current = null;
      }
    })();

    fetchProductsPromiseRef.current = request;
    return request;
  }, []);

  const addDefaultConfiguration = (productIdx: number) => {
    const product = products[productIdx];
    if (!product) return;
    const dbProduct = fetchedProducts.find((p) => p.id === product.id);
    if (!dbProduct) return;

    const config = createConfigurationFromProduct(dbProduct);

    setProducts((prev) =>
      prev.map((p, i) =>
        i === productIdx
          ? {
              ...p,
              configurations: [...p.configurations, config],
              quantity: Math.max(1, p.configurations.length + 1),
            }
          : p
      )
    );
  };

  const availableProducts: ProductType[] = categories.map((cat) => {
    const filteredProducts = fetchedProducts.filter((p) => {
      return normalizeCategoryKey(p.category) === cat.key;
    });

    return {
      title: cat.key,
      variants: filteredProducts.map((p) => ({
        value: p.id,
        label: p.variant,
      })),
    };
  });

  return (
    <ProductContext.Provider
      value={{
        products,
        fetchedProducts,
        addProduct,
        removeProduct,
        addConfiguration,
        updateConfiguration,
        removeConfiguration,
        setProducts,
        setProductQuantity,
        availableProducts,
        fetchProducts,
        loadingProducts,
        productsError,
        priceLoading,
        setPriceLoading,
        addDefaultConfiguration,
        syncQuantityWithConfigurations,
        validateProductQuantities,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProductContext = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProductContext must be used within a ProductProvider");
  }
  return context;
};

function ensureDefaultInValues(input: any) {
  if (
    input.default &&
    Array.isArray(input.values) &&
    !input.values.includes(input.default)
  ) {
    input.values = [input.default, ...input.values];
  }
}

export function createConfigurationFromProduct(
  product: any,
  _subvariant?: string
): ProductConfiguration {
  const config: ProductConfiguration = { quantity: 1 };

  let mainInputs: any[] = [];
  if (product.inputsBySubvariant?.main) {
    mainInputs = product.inputsBySubvariant.main;
  } else if (Array.isArray(product.inputs)) {
    mainInputs = product.inputs;
  } else if (product.inputs?.main) {
    mainInputs = product.inputs.main;
  }

  mainInputs.forEach((input: any) => {
    const field = PRODUCT_INPUT_TYPES.find((f) => f.id === input.type);
    if (!field) return;
    if (field.hasValues) ensureDefaultInValues(input);
    const value =
      input.default !== undefined && input.default !== null
        ? String(input.default)
        : "";
    config[field.configKey] = value;
  });

  return config;
}
