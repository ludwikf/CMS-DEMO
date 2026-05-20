import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;

    let whereClause: any = {
      products: {
        some: {
          status: {
            not: "INACTIVE",
          },
        },
      },
    };

    if (userRole !== "pracownik" && userRole !== "host") {
      whereClause.products = {
        some: {
          status: "ACTIVE",
        },
      };
    }

    const pricingTemplates = await prisma.pricingTemplate.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(pricingTemplates);
  } catch (error) {
    console.error("Error fetching pricing templates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
