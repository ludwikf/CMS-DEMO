import { prisma } from "@/lib/db";
import {
  warehouseJsonResponse,
  warehouseOptionsResponse,
} from "@/lib/warehouse-cors";

export async function OPTIONS() {
  return warehouseOptionsResponse();
}

export async function GET() {
  try {
    const stock = await prisma.warehouseStock.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        quantity: true,
        unit: true,
        updatedAt: true,
      },
    });
    return warehouseJsonResponse({ items: stock });
  } catch (error) {
    console.error("Warehouse stock GET error:", error);
    return warehouseJsonResponse(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
