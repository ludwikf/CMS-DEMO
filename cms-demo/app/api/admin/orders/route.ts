import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma, OrderStatus } from "@prisma/client";


export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "host") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";
    const status = (searchParams.get("status") as OrderStatus) || undefined;
    const deliveryMethod = searchParams.get("deliveryMethod") || undefined;

    const where: Prisma.OrderWhereInput = {
      ...(status ? { status } : { status: { not: "DRAFT" } }),
      ...(deliveryMethod && {
        shipping: {
          path: ["method"],
          equals: deliveryMethod,
        },
      }),
      ...(search && {
        OR: [
          {
            orderNumber: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            user: {
              email: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        ],
      }),
    };

    const totalCount = await prisma.order.count({ where });
    const totalPages = Math.ceil(totalCount / limit);

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const ordersWithName = orders.map((order) => ({
      ...order,
      orderName: (order.notes ?? "") as string,
    }));

    return NextResponse.json({
      orders: ordersWithName,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error in orders API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
