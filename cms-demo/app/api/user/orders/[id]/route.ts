import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { OrderStatus as PrismaOrderStatus } from "@prisma/client";

function mapStatus(
  status: PrismaOrderStatus,
  shipping?: { method?: string } | null
): string {
  switch (status) {
    case "UNCONFIRMED":
    case "PENDING":
      return "unconfirmed";
    case "IN_PROGRESS":
      return "inProgress";
    case "CONFIRMED":
      return "confirmed";
    case "DELIVERED":
      return shipping?.method === "pickup" ? "pickup" : "delivery";
    case "CANCELLED":
      return "cancelled";
    case "FINISHED":
      return "finished";
    default:
      return "unconfirmed";
  }
}


export async function GET(
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
      include: { items: true },
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

    const shipping = order.shipping as {
      method?: string;
      city?: string;
      address?: string;
      zipCode?: string;
    } | null;
    const status = mapStatus(order.status as PrismaOrderStatus, shipping);

    type ConfigRecord = Record<string, unknown>;
    const items: Array<ConfigRecord & { id: string; product: string; type: string; price?: number }> = [];
    let itemIdx = 0;
    for (const oi of order.items) {
      const productData = (oi.productData as { variant?: string }) || {};
      const configs = (oi.configurations as ConfigRecord[]) || [];
      const variant = productData.variant ?? "product";
      for (let c = 0; c < configs.length; c++) {
        const config = configs[c] as Record<string, unknown>;
        const subvariant = (config.subvariant as string) ?? "Standard";
        const qty = Number(config.quantity) ?? 1;
        const unitPrice = Number(config.price) ?? 0;
        const totalForPosition = unitPrice * qty;
        items.push({
          ...config,
          id: `${oi.id}-${itemIdx++}`,
          product: variant,
          type: subvariant,
          price: totalForPosition,
        });
      }
    }

    const result = {
      id: order.id,
      orderNumber: order.orderNumber,
      orderName: order.notes ?? "",
      status,
      totalAmount: order.totalAmount,
      finishedAt:
        order.status === "FINISHED" ? order.updatedAt.toISOString() : "",
      deliveryMethod: shipping?.method ?? "delivery",
      city: shipping?.city,
      address: shipping?.address,
      zipCode: shipping?.zipCode,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      userId: order.userId,
      items,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in user order detail API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
