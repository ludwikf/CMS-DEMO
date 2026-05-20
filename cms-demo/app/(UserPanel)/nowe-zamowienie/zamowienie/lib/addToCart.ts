import type { CartProduct } from "@/app/contexts/ProductContext";

interface AddToCartResponse {
  success: boolean;
  error?: string;
  itemId?: string;
}

function calculateProductTotal(product: CartProduct): number {
  return product.configurations.reduce(
    (sum, config) => sum + (config.price || 0) * (config.quantity || 1),
    0
  );
}

function calculateGrandTotal(products: CartProduct[]): number {
  return products.reduce(
    (sum, product) => sum + calculateProductTotal(product),
    0
  );
}

export async function addMultipleProductsToCart(
  products: CartProduct[],
  orderName?: string
): Promise<AddToCartResponse> {
  try {
    const totalAmount = calculateGrandTotal(products);

    const payload: {
      products: CartProduct[];
      totalAmount: number;
      orderName?: string;
    } = {
      products,
      totalAmount,
    };
    if (orderName !== undefined && orderName !== null) {
      payload.orderName = orderName.trim() || undefined;
    }

    const response = await fetch("/api/cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error:
          (errorData as { error?: string }).error ||
          "Nie udało się dodać produktów do koszyka",
      };
    }

    const data = await response.json();
    return {
      success: true,
      itemId: data.id,
    };
  } catch (error) {
    const isNetworkError =
      error instanceof TypeError && error.message === "Failed to fetch";
    console.error("Error adding products to cart:", error);
    return {
      success: false,
      error: isNetworkError
        ? "Błąd połączenia. Sprawdź internet i spróbuj ponownie."
        : "Nie udało się dodać do koszyka. Spróbuj ponownie.",
    };
  }
}
