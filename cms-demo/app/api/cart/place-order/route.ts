import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import {
  placeOrderBodySchema,
  formatPlaceOrderValidationErrors,
} from "@/lib/order-summary";
import { Prisma } from "@prisma/client";
import { OrderStatus } from "@prisma/client";

function requiresIndividualQuote(
  orders: Array<{ items: Array<{ configurations: unknown }> }>
): boolean {
  return orders.some((order) =>
    order.items.some((item) => {
      const configs = item.configurations;
      if (!configs || !Array.isArray(configs)) return false;
      return configs.some(
        (c: { needsIndividualQuote?: boolean }) =>
          c.needsIndividualQuote === true
      );
    })
  );
}


export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = placeOrderBodySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Błąd walidacji",
          fields: formatPlaceOrderValidationErrors(parseResult.error),
        },
        { status: 400 }
      );
    }
    const validated = parseResult.data;

    const orderIds = new Set(validated.cartItemIds);
    const draftOrders = await prisma.order.findMany({
      where: {
        id: { in: Array.from(orderIds) },
        userId: session.user.id,
        status: OrderStatus.DRAFT,
      },
      include: { items: true },
    });

    if (draftOrders.length !== orderIds.size) {
      return NextResponse.json(
        { error: "Niektóre pozycje nie należą do koszyka lub są już złożone." },
        { status: 400 }
      );
    }

    const requiresIndividualQuoteFlag = requiresIndividualQuote(draftOrders);

    const shipping =
      validated.delivery.method === "pickup"
        ? {
            method: "pickup" as const,
            city: null,
            address: null,
            zipCode: null,
            apartment: null,
            localNumber: null,
            deliveryNotes: null,
          }
        : {
            method: "delivery" as const,
            city: validated.delivery.city ?? null,
            address: validated.delivery.address ?? null,
            zipCode: validated.delivery.zipCode ?? null,
            apartment: validated.delivery.apartment ?? null,
            localNumber: validated.delivery.localNumber ?? null,
            deliveryNotes: validated.delivery.deliveryNotes ?? null,
          };

    const customer = {
      firstName: validated.personal.firstName,
      lastName: validated.personal.lastName,
      email: validated.personal.email,
      phone: validated.personal.phone,
      company: validated.personal.company ?? null,
      nip: validated.personal.nip ?? null,
    };

    const updatedOrders: {
      id: string;
      orderNumber: string;
      totalAmount: number;
    }[] = [];

    for (const order of draftOrders) {
      const updated = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.UNCONFIRMED,
          shipping: shipping as Prisma.JsonObject,
          customer: customer as Prisma.JsonObject,
        },
      });
      updatedOrders.push({
        id: updated.id,
        orderNumber: updated.orderNumber,
        totalAmount: updated.totalAmount,
      });
    }

    const totalAmount = updatedOrders.reduce(
      (sum, o) => sum + o.totalAmount,
      0
    );

    return NextResponse.json(
      {
        orders: updatedOrders,
        totalAmount,
        requiresIndividualQuote: requiresIndividualQuoteFlag,
        message: "Zamówienie złożone",
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Błąd walidacji",
          fields: formatPlaceOrderValidationErrors(error),
        },
        { status: 400 }
      );
    }
    console.error("Place order error:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
