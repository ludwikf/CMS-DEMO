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


export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Zaloguj się, aby zobaczyć zamówienia",
        },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const page = Number(searchParams.get("page")) || 1;
    const limit = Math.min(Number(searchParams.get("limit")) || 10, 50);
    const search = (searchParams.get("search") || "").trim();
    const statusFilter = searchParams.get("status") || undefined;
    const deliveryFilter = searchParams.get("deliveryMethod") || undefined;

    const statusToPrisma: Record<string, PrismaOrderStatus[]> = {
      unconfirmed: ["UNCONFIRMED", "PENDING"],
      inProgress: ["IN_PROGRESS"],
      confirmed: ["CONFIRMED"],
      delivery: ["DELIVERED"],
      pickup: ["DELIVERED"],
      cancelled: ["CANCELLED"],
      finished: ["FINISHED"],
    };

    const where: Record<string, unknown> = {
      userId: session.user.id,
      status: { not: "DRAFT" },
    };
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }
    if (statusFilter && statusToPrisma[statusFilter]) {
      where.status = { in: statusToPrisma[statusFilter] };
      if (statusFilter === "pickup") {
        (where as Record<string, unknown>).shipping = {
          path: ["method"],
          equals: "pickup",
        };
      } else if (statusFilter === "delivery") {
        (where as Record<string, unknown>).shipping = {
          path: ["method"],
          equals: "delivery",
        };
      }
    }
    if (deliveryFilter) {
      (where as Record<string, unknown>).shipping = {
        path: ["method"],
        equals: deliveryFilter,
      };
    }

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    const mappedOrders = orders.map((order) => {
        const shipping = order.shipping as { method?: string } | null;
        const rawStatus = order.status as PrismaOrderStatus;
        const status = mapStatus(rawStatus, shipping);
        return {
          id: order.id,
          orderNumber: order.orderNumber,
          orderName: order.notes ?? "",
          status,
          totalAmount: order.totalAmount,
          finishedAt:
            order.status === "FINISHED" ? order.updatedAt.toISOString() : "",
          deliveryMethod: shipping?.method ?? "delivery",
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
        };
      });

    return NextResponse.json({
      orders: mappedOrders,
      totalCount,
      pagination: {
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error in user orders API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
