import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { OrderStatus } from "@prisma/client";
import { z } from "zod";

const cancelBodySchema = z.object({
  orderId: z.string().min(1).optional(),
  id: z.string().min(1).optional(),
}).refine((data) => data.orderId ?? data.id, { message: "Brak ID zamówienia" });


export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Zaloguj się" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = cancelBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Bad request",
          message: parsed.error.errors[0]?.message ?? "Brak ID zamówienia",
        },
        { status: 400 }
      );
    }

    const orderId = parsed.data.orderId ?? parsed.data.id;
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

    const cancellableStatuses: OrderStatus[] = [
      OrderStatus.UNCONFIRMED,
      OrderStatus.PENDING,
    ];
    if (!cancellableStatuses.includes(order.status)) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message:
            "Można anulować tylko zamówienie niepotwierdzone (oczekujące na potwierdzenie).",
        },
        { status: 403 }
      );
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
    });

    return NextResponse.json(
      { message: "Zamówienie zostało anulowane" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error cancelling order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
