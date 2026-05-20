import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recalculateCartProducts } from "@/lib/pricing";
import { z } from "zod";
import { buildOrderNumber } from "@/lib/order-number";
import { OrderStatus, PrismaJson } from "@/lib/prisma-types";
import type { ProductStatus } from "@/app/types/product";
import type { PriceableProduct } from "@/lib/pricing";

type DraftDbProduct = PriceableProduct & {
  id: string;
  status: ProductStatus;
  variant: string;
  category: string;
};

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
  })
  .passthrough();

const draftProductSchema = z.object({
  id: z.string(),
  variant: z.string(),
  category: z.string(),
  quantity: z.number().int().positive(),
  configurations: z.array(productConfigurationSchema).nonempty(),
});

const createDraftSchema = z.object({
  products: z.array(draftProductSchema).nonempty(),
  totalAmount: z.number().min(0),
  orderName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = createDraftSchema.parse(body);

    const productIds = validated.products.map((p) => p.id);
    const products = (await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        pricingTemplate: { select: { id: true, name: true, template: true } },
      },
    })) as DraftDbProduct[];
    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: "Niektóre produkty nie zostały znalezione." },
        { status: 404 }
      );
    }
    const inactive = products.filter((p) => p.status !== "ACTIVE");
    if (inactive.length > 0) {
      const hasTest = inactive.some((p) => p.status === "TEST");
      return NextResponse.json(
        {
          error: hasTest
            ? "Nie można dodać produktu testowego do koszyka."
            : "Niektóre produkty są niedostępne.",
        },
        { status: 400 }
      );
    }

    const authoritativeCart = recalculateCartProducts(
      validated.products,
      new Map(products.map((product) => [product.id, product]))
    );

    if (
      Math.abs(authoritativeCart.totalAmount - validated.totalAmount) > 0.01
    ) {
      console.warn("Client draft order total mismatch detected.", {
        provided: validated.totalAmount,
        authoritative: authoritativeCart.totalAmount,
      });
    }

    const maxRetries = 5;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const { orderNumber, code } = buildOrderNumber();
      const orderName = validated.orderName?.trim() || `Zlecenie#${code}`;

      try {
        const order = await prisma.order.create({
          data: {
            orderNumber,
            status: OrderStatus.DRAFT,
            totalAmount: authoritativeCart.totalAmount,
            notes: orderName,
            userId: session.user.id,
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
                  configurations: configs as PrismaJson.JsonArray,
                  price,
                  productData: {
                    variant: prod.variant,
                    category: prod.category,
                  } as PrismaJson.JsonObject,
                };
              }),
            },
          },
          include: { items: true },
        });
        return NextResponse.json(
          { id: order.id, orderNumber: order.orderNumber },
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
      { error: "Nie udało się utworzyć zamówienia. Spróbuj ponownie." },
      { status: 500 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Nieprawidłowe dane", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create draft order error:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
