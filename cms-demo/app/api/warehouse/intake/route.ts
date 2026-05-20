import { NextRequest } from "next/server";
import {
  applyWarehouseIntake,
  WarehouseIntakeDuplicateError,
} from "@/lib/warehouse";
import { warehouseIntakePayloadSchema } from "@/lib/warehouse-schema";
import {
  warehouseJsonResponse,
  warehouseOptionsResponse,
} from "@/lib/warehouse-cors";

export async function OPTIONS() {
  return warehouseOptionsResponse();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = warehouseIntakePayloadSchema.safeParse(body);
    if (!parsed.success) {
      return warehouseJsonResponse(
        {
          error: "Bad request",
          message: "Nieprawidłowy format danych magazynu",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const result = await applyWarehouseIntake(parsed.data);
    return warehouseJsonResponse(result);
  } catch (error) {
    if (error instanceof WarehouseIntakeDuplicateError) {
      return warehouseJsonResponse(
        { error: "Conflict", message: error.message },
        { status: 409 }
      );
    }
    console.error("Warehouse intake error:", error);
    return warehouseJsonResponse(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
