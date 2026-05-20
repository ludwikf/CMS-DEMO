import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { validateDatabaseProduct } from "@/lib/productValidation";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;

    const whereClause: Prisma.ProductWhereInput = {
      status: {
        not: "INACTIVE",
      },
    };

    if (userRole !== "pracownik" && userRole !== "host") {
      whereClause.status = "ACTIVE";
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        pricingTemplate: { select: { id: true, name: true, template: true } },
      },
    });

    const validProducts: typeof products = [];
    const invalidProducts: Array<{
      id: string;
      variant: string;
      errors: string[];
    }> = [];

    products.forEach((product) => {
      const validationErrors = validateDatabaseProduct(product);
      if (validationErrors.length === 0) {
        validProducts.push(product);
      } else {
        invalidProducts.push({
          id: product.id,
          variant: product.variant,
          errors: validationErrors,
        });
        console.warn(
          `Product ${product.id} (${product.variant}) has validation issues:`,
          validationErrors
        );
      }
    });

    if (invalidProducts.length > 0) {
      console.error(
        `${invalidProducts.length} products failed validation and were filtered out:`,
        invalidProducts
      );
    }

    return NextResponse.json(validProducts);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
