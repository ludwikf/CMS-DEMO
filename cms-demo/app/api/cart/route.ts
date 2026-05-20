import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recalculateCartProducts } from "@/lib/pricing";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { OrderStatus } from "@prisma/client";
import { buildOrderNumber } from "@/lib/order-number";

const dimOptional = () =>
  z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) =>
      val === undefined || val === null ? undefined : String(val)
    );

const productConfigurationSchema = z
  .object({
    width: dimOptional(),
    height: dimOptional(),
    totalWidth: dimOptional(),
    patternWidth: dimOptional(),
    materialWidth: dimOptional(),
    fabricClosureHeight: dimOptional(),
    fabricClosureHeightDayNight: dimOptional(),
    material: z.string().optional(),
    color: z.string().optional(),
    quantity: z.number(),
    subvariant: z.string().optional(),
    price: z.number().optional(),
    guide: z.string().optional(),
    mountingType: z.string().optional(),
    handle: z.string().optional(),
    accessories: z
      .array(z.object({ name: z.string(), quantity: z.number() }))
      .optional(),
    handleValue: z.string().optional(),
    materialValue: z.string().optional(),
    guideValue: z.string().optional(),
    note: z.string().optional(),
    test: z.string().optional(),
    handleCustom: z.string().optional(),
    slideType: z.string().optional(),
    needsIndividualQuote: z.boolean().optional(),
  })
  .passthrough();

const cartProductSchema = z.object({
  id: z.string(),
  variant: z.string(),
  category: z.string(),
  quantity: z.number().int().positive(),
  configurations: z.array(productConfigurationSchema).nonempty(),
});

const addToCartSchema = z.object({
  products: z.array(cartProductSchema).nonempty(),
  totalAmount: z.number().min(0),
  orderName: z.string().optional(),
});

function orderToCartEntry(order: {
  id: string;
  orderNumber: string;
  totalAmount: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    productId: string;
    quantity: number;
    configurations: unknown;
    productData: unknown;
  }>;
}) {
  const products = order.items.map((oi) => {
    const pd = oi.productData as { variant?: string; category?: string };
    return {
      id: oi.productId,
      variant: pd?.variant ?? "",
      category: pd?.category ?? "",
      configurations:
        (oi.configurations as Array<Record<string, unknown>>) ?? [],
      quantity: oi.quantity,
    };
  });
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    orderName: order.notes ?? undefined,
    products,
    totalAmount: Number(order.totalAmount),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = await resolveSessionUserId(session?.user?.id);
    if (!userId) {
      return NextResponse.json(
        { error: "Sesja wygasła. Zaloguj się ponownie." },
        { status: 401 }
      );
    }

    const orders = await prisma.order.findMany({
      where: {
        userId,
        status: OrderStatus.DRAFT,
      },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    const items = orders.map(orderToCartEntry);
    return NextResponse.json({ id: "", items });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error fetching cart:", msg);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = await resolveSessionUserId(session?.user?.id);
    if (!userId) {
      return NextResponse.json(
        { error: "Sesja wygasła. Zaloguj się ponownie." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = addToCartSchema.parse(body);

    const productIds = validatedData.products.map((p) => p.id);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        pricingTemplate: { select: { id: true, name: true, template: true } },
      },
    });
    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: "Some products not found" },
        { status: 404 }
      );
    }
    const inactiveProducts = products.filter((p) => p.status !== "ACTIVE");
    if (inactiveProducts.length > 0) {
      const hasTest = inactiveProducts.some((p) => p.status === "TEST");
      const errorMessage = hasTest
        ? "Nie można dodać produktu testowego do koszyka."
        : "Niektóre produkty są niedostępne.";
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const authoritativeCart = recalculateCartProducts(
      validatedData.products,
      new Map(products.map((product) => [product.id, product]))
    );

    if (
      Math.abs(authoritativeCart.totalAmount - validatedData.totalAmount) > 0.01
    ) {
      console.warn("Client cart total mismatch detected.", {
        provided: validatedData.totalAmount,
        authoritative: authoritativeCart.totalAmount,
      });
    }

    const maxRetries = 5;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const { orderNumber, code } = buildOrderNumber();
      const notes = validatedData.orderName?.trim() || `Zlecenie#${code}`;

      try {
        const order = await prisma.order.create({
          data: {
            orderNumber,
            status: OrderStatus.DRAFT,
            totalAmount: authoritativeCart.totalAmount,
            notes,
            userId,
            items: {
              create: authoritativeCart.products.map((prod) => {
                const configs = prod.configurations as Array<{
                  price?: number;
                  quantity?: number;
                  [k: string]: unknown;
                }>;
                const price = configs.reduce(
                  (s, c) => s + (c.price ?? 0) * (c.quantity ?? 1),
                  0
                );
                return {
                  productId: prod.id,
                  quantity: configs.length,
                  configurations: configs as Prisma.JsonArray,
                  price,
                  productData: {
                    variant: prod.variant,
                    category: prod.category,
                  } as Prisma.JsonObject,
                };
              }),
            },
          },
        });
        return NextResponse.json({ id: order.id }, { status: 201 });
      } catch (err: unknown) {
        const isUniqueViolation =
          err &&
          typeof err === "object" &&
          "code" in err &&
          (err as { code?: string }).code === "P2002";
        if (isUniqueViolation && attempt < maxRetries - 1) continue;
        throw err;
      }
    }

    return NextResponse.json(
      { error: "Nie udało się dodać do koszyka. Spróbuj ponownie." },
      { status: 500 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error adding to cart:", message);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Nieprawidłowe dane. Sprawdź formularz i spróbuj ponownie." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    const userId = await resolveSessionUserId(session?.user?.id);
    if (!userId) {
      return NextResponse.json(
        { error: "Sesja wygasła. Zaloguj się ponownie." },
        { status: 401 }
      );
    }

    await prisma.order.deleteMany({
      where: {
        userId,
        status: OrderStatus.DRAFT,
      },
    });

    return NextResponse.json({ message: "Cart cleared" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error clearing cart:", msg);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
