import { prisma } from "@/lib/db";
import type { WarehouseItem } from "@/lib/warehouse-schema";

export async function getWarehouseData() {
  const [stock, intakes] = await Promise.all([
    prisma.warehouseStock.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.warehouseIntake.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const intakesWithItems = intakes.map((intake) => ({
    id: intake.id,
    intakeId: intake.intakeId,
    label: intake.label,
    createdAt: intake.createdAt.toISOString(),
    items: intake.items as WarehouseItem[],
  }));

  return { stock, intakes: intakesWithItems };
}
