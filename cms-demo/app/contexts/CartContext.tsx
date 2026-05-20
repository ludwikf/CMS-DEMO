"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useSession } from "next-auth/react";
import type { CartProduct } from "@/app/contexts/ProductContext";


export type CartEntry = {
  id: string;
  orderNumber?: string;
  orderName?: string;
  products: CartProduct[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
};

export type CartContextType = {
  items: CartEntry[];
  selectedIds: Set<string>;
  isSelected: (id: string) => boolean;
  toggleSelected: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  selectedItems: CartEntry[];
  selectedTotalAmount: number;
  selectedTotalConfigurationsCount: number;
  addItem: (
    entry: Omit<CartEntry, "id" | "createdAt" | "updatedAt">
  ) => Promise<string>;
  removeItem: (id: string) => Promise<void>;
  updateItem: (
    id: string,
    updates: Partial<Omit<CartEntry, "id" | "createdAt" | "updatedAt">>
  ) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  cartLoading: boolean;
  totalItemsCount: number;
  totalConfigurationsCount: number;
};

const CartContext = createContext<CartContextType | null>(null);

function mapCartItemToEntry(item: {
  id: string;
  products: unknown;
  totalAmount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  orderNumber?: string;
  orderName?: string;
}): CartEntry {
  return {
    id: item.id,
    orderNumber: item.orderNumber,
    orderName: item.orderName,
    products: (item.products as CartProduct[]) ?? [],
    totalAmount: Number(item.totalAmount),
    createdAt:
      typeof item.createdAt === "string"
        ? item.createdAt
        : new Date(item.createdAt).toISOString(),
    updatedAt:
      typeof item.updatedAt === "string"
        ? item.updatedAt
        : new Date(item.updatedAt).toISOString(),
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const [items, setItems] = useState<CartEntry[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [cartLoading, setCartLoading] = useState(true);

  const fetchCart = useCallback(async () => {
    if (status !== "authenticated") return;
    try {
      const res = await fetch("/api/cart");
      if (!res.ok) {
        if (res.status === 401) {
          setItems([]);
          setSelectedIds(new Set());
          return;
        }
        throw new Error("Failed to fetch cart");
      }
      const cart = await res.json();
      const entries: CartEntry[] = (cart.items ?? []).map(mapCartItemToEntry);
      setItems(entries);
      setSelectedIds(new Set(entries.map((e) => e.id)));
    } catch {
      setItems([]);
      setSelectedIds(new Set());
    } finally {
      setCartLoading(false);
    }
  }, [status]);

  useEffect(() => {
    if (status === "unauthenticated" || status === "loading") {
      setItems([]);
      setSelectedIds(new Set());
      setCartLoading(status === "loading");
      return;
    }
    if (status === "authenticated") {
      fetchCart();
    }
  }, [status, fetchCart]);

  const refreshCart = useCallback(async () => {
    setCartLoading(true);
    await fetchCart();
  }, [fetchCart]);

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map((e) => e.id)));
  }, [items]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectedItems = items.filter((e) => selectedIds.has(e.id));
  const selectedTotalAmount = selectedItems.reduce(
    (sum, e) => sum + e.totalAmount,
    0
  );
  const selectedTotalConfigurationsCount = selectedItems.reduce(
    (sum, e) =>
      sum + e.products.reduce((s, p) => s + (p.configurations?.length ?? 0), 0),
    0
  );

  const addItem = useCallback(
    async (
      entry: Omit<CartEntry, "id" | "createdAt" | "updatedAt">
    ): Promise<string> => {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products: entry.products,
          totalAmount: entry.totalAmount,
          orderName: entry.orderName,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Nie udało się dodać do koszyka");
      }
      const created = await res.json();
      await fetchCart();
      return created.id;
    },
    [fetchCart]
  );

  const removeItem = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`/api/cart/items/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Nie udało się usunąć pozycji");
    setItems((prev) => prev.filter((item) => item.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const updateItem = useCallback(
    async (
      id: string,
      updates: Partial<Omit<CartEntry, "id" | "createdAt" | "updatedAt">>
    ): Promise<void> => {
      const payload: {
        products?: CartProduct[];
        totalAmount?: number;
        orderName?: string;
      } = {};
      if (updates.products) payload.products = updates.products;
      if (updates.totalAmount !== undefined)
        payload.totalAmount = updates.totalAmount;
      if (updates.orderName !== undefined)
        payload.orderName = updates.orderName;
      const res = await fetch(`/api/cart/items/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg =
          (data as { error?: string }).error ||
          "Nie udało się zaktualizować pozycji";
        throw new Error(msg);
      }
      await fetchCart();
    },
    [fetchCart]
  );

  const clearCart = useCallback(async (): Promise<void> => {
    const res = await fetch("/api/cart", { method: "DELETE" });
    if (!res.ok) throw new Error("Nie udało się wyczyścić koszyka");
    setItems([]);
    setSelectedIds(new Set());
  }, []);

  const totalItemsCount = items.reduce(
    (sum, entry) => sum + entry.products.length,
    0
  );
  const totalConfigurationsCount = items.reduce(
    (sum, entry) =>
      sum +
      entry.products.reduce((s, p) => s + (p.configurations?.length ?? 0), 0),
    0
  );

  const value: CartContextType = {
    items,
    selectedIds,
    isSelected,
    toggleSelected,
    selectAll,
    deselectAll,
    selectedItems,
    selectedTotalAmount,
    selectedTotalConfigurationsCount,
    addItem,
    removeItem,
    updateItem,
    clearCart,
    refreshCart,
    cartLoading,
    totalItemsCount,
    totalConfigurationsCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
