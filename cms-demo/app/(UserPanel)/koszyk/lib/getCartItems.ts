import { cookies } from "next/headers";

export interface ProductConfiguration {
  width?: string;
  height?: string;
  totalWidth?: string;
  patternWidth?: string;
  materialWidth?: string;
  fabricClosureHeight?: string;
  fabricClosureHeightDayNight?: string;
  material?: string;
  color?: string;
  quantity: number;
  subvariant?: string;
  price?: number;
  guide?: string;
  mountingType?: string;
  handle?: string;
  accessories?: Array<{ name: string; quantity: number }>;
  handleValue?: string;
  materialValue?: string;
  guideValue?: string;
  note?: string;
  test?: string;
  handleCustom?: string;
  slideType?: string;
  [key: string]: any;
}

export interface CartProduct {
  id: string;
  variant: string;
  category: string;
  quantity: number;
  configurations: ProductConfiguration[];
}

export interface CartItem {
  id: string;
  products: CartProduct[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Cart {
  id: string;
  items: CartItem[];
}

export async function getCartItems(): Promise<Cart> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const url = `${
      process.env.NEXTAUTH_URL || "http://localhost:3000"
    }/api/cart`;

    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        Cookie: cookieHeader,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch cart: ${res.status}`);
    }

    const data: Cart = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching cart:", error);
    return {
      id: "",
      items: [],
    };
  }
}
