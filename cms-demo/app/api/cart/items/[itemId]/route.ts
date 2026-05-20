import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recalculateCartProducts } from "@/lib/pricing";
import { z } from "zod";
import { Prisma } from "@prisma/client";

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

const updateCartItemSchema = z.object({
  products: z.array(cartProductSchema).optional(),
  totalAmount: z.number().min(0).optional(),
  orderName: z.string().optional(),
});

async function getDraftOrder(orderId: string, userId: string) {
  return prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
      status: "DRAFT",
    },
    include: { items: true },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itemId } = await params;
    const order = await getDraftOrder(itemId, session.user.id);

    if (!order) {
      return NextResponse.json(
        { error: "Pozycja nie została znaleziona" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validatedData = updateCartItemSchema.parse(body);
    let authoritativeCart: ReturnType<typeof recalculateCartProducts> | null = null;

    if (
      validatedData.products !== undefined &&
      validatedData.products.length > 0
    ) {
      const productIds = validatedData.products.map((p) => p.id);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: {
          pricingTemplate: { select: { id: true, name: true, template: true } },
        },
      });
      if (products.length !== productIds.length) {
        return NextResponse.json(
          { error: "Niektóre produkty nie zostały znalezione." },
          { status: 404 }
        );
      }
      const inactiveProducts = products.filter((p) => p.status !== "ACTIVE");
      if (inactiveProducts.length > 0) {
        const hasTest = inactiveProducts.some((p) => p.status === "TEST");
        return NextResponse.json(
          {
            error: hasTest
              ? "Nie można zapisać zmian, ponieważ produkt jest testowy."
              : "Niektóre produkty są niedostępne.",
          },
          { status: 400 }
        );
      }

      authoritativeCart = recalculateCartProducts(
        validatedData.products,
        new Map(products.map((product) => [product.id, product]))
      );
    }

    if (
      authoritativeCart &&
      validatedData.totalAmount !== undefined &&
      Math.abs(authoritativeCart.totalAmount - validatedData.totalAmount) > 0.01
    ) {
      console.warn("Client cart item total mismatch detected.", {
        orderId: order.id,
        provided: validatedData.totalAmount,
        authoritative: authoritativeCart.totalAmount,
      });
    }

    if (validatedData.products !== undefined) {
      await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
      const createItems = (
        authoritativeCart?.products ?? validatedData.products
      ).map((prod) => {
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
      });
      await prisma.orderItem.createMany({
        data: createItems.map((item) => ({
          orderId: order.id,
          ...item,
        })),
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        ...(authoritativeCart && {
          totalAmount: authoritativeCart.totalAmount,
        }),
        ...(!authoritativeCart && validatedData.totalAmount !== undefined
          ? {
              totalAmount: validatedData.totalAmount,
            }
          : {}),
        ...(validatedData.orderName !== undefined &&
          validatedData.orderName.trim() !== "" && {
          notes: validatedData.orderName.trim(),
        }),
      },
      include: { items: true },
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error updating cart item:", msg);
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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itemId } = await params;
    const order = await getDraftOrder(itemId, session.user.id);

    if (!order) {
      return NextResponse.json(
        { error: "Pozycja nie została znaleziona" },
        { status: 404 }
      );
    }

    await prisma.order.delete({
      where: { id: order.id },
    });

    return NextResponse.json({ message: "Item removed from cart" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error removing cart item:", msg);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
