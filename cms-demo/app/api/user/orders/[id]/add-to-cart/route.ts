import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { OrderStatus } from "@prisma/client";
import { buildOrderNumber } from "@/lib/order-number";


export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Zaloguj się" },
        { status: 401 }
      );
    }

    const { id: orderId } = await params;
    if (!orderId) {
      return NextResponse.json(
        { error: "Bad request", message: "Brak ID zamówienia" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id,
        status: { not: "DRAFT" },
      },
      include: {
        items: { include: { product: true } },
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          error: "Not found",
          message: "Zamówienie nie istnieje lub nie masz do niego dostępu",
        },
        { status: 404 }
      );
    }

    if (order.items.length === 0) {
      return NextResponse.json(
        { error: "Bad request", message: "Zamówienie nie zawiera produktów" },
        { status: 400 }
      );
    }

    const products: Array<{
      id: string;
      variant: string;
      category: string;
      quantity: number;
      configurations: Array<Record<string, unknown>>;
    }> = [];

    let totalAmount = 0;

    for (const item of order.items) {
      const configs = (item.configurations as Array<{
        width?: string | number;
        height?: string | number;
        quantity?: number;
        price?: number;
        [key: string]: unknown;
      }>) || [];

      const configurations = configs.map((c) => {
        const q = c.quantity ?? 1;
        const p = c.price ?? 0;
        totalAmount += p * q;
        return {
          ...c,
          width: c.width != null ? String(c.width) : undefined,
          height: c.height != null ? String(c.height) : undefined,
          quantity: q,
          price: p,
        };
      });

      if (configurations.length === 0) continue;

      products.push({
        id: item.productId,
        variant: item.product.variant,
        category: item.product.category,
        quantity: configurations.length,
        configurations,
      });
    }

    if (products.length === 0) {
      return NextResponse.json(
        { error: "Bad request", message: "Brak poprawnych pozycji do dodania" },
        { status: 400 }
      );
    }

    totalAmount = Math.round(totalAmount * 100) / 100;
    const orderName = (order.notes?.trim() || undefined) ?? undefined;

    const maxRetries = 5;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const { orderNumber, code } = buildOrderNumber();
      const notes = orderName || `Zlecenie#${code}`;

      try {
        const draft = await prisma.order.create({
          data: {
            orderNumber,
            status: OrderStatus.DRAFT,
            totalAmount,
            notes,
            userId: session.user.id,
            items: {
              create: products.map((prod) => {
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
                  quantity: prod.quantity,
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
        return NextResponse.json(
          { id: draft.id, message: "Dodano do koszyka" },
          { status: 201 }
        );
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
    console.error("Error adding order to cart:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
