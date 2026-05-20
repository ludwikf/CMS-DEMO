import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { OrderStatus as PrismaOrderStatus } from "@prisma/client";

function frontendToPrismaStatus(
  status: string,
  deliveryMethod?: string
): PrismaOrderStatus {
  switch (status) {
    case "unconfirmed":
      return "UNCONFIRMED";
    case "confirmed":
      return "CONFIRMED";
    case "inProgress":
      return "IN_PROGRESS";
    case "delivery":
      return "DELIVERED";
    case "pickup":
      return "DELIVERED";
    case "finished":
      return "FINISHED";
    case "cancelled":
      return "CANCELLED";
    default:
      return "UNCONFIRMED";
  }
}


export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "host") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: orderId } = await params;
    if (!orderId) {
      return NextResponse.json(
        { error: "Bad request", message: "Brak ID zamówienia" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { status: frontendStatus } = body;
    if (typeof frontendStatus !== "string") {
      return NextResponse.json(
        { error: "Bad request", message: "Brak statusu w żądaniu" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId },
      select: { id: true, shipping: true },
    });
    if (!order) {
      return NextResponse.json(
        { error: "Not found", message: "Zamówienie nie istnieje" },
        { status: 404 }
      );
    }

    const shipping = order.shipping as { method?: string } | null;
    const deliveryMethod = shipping?.method ?? "delivery";
    const prismaStatus = frontendToPrismaStatus(frontendStatus, deliveryMethod);

    await prisma.order.update({
      where: { id: orderId },
      data: { status: prismaStatus },
    });

    return NextResponse.json({ ok: true, status: frontendStatus });
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
