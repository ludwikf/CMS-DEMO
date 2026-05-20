import { prisma } from "@/lib/db";
import type { WarehouseIntakePayload } from "@/lib/warehouse-schema";

export class WarehouseIntakeDuplicateError extends Error {
  constructor(intakeId: string) {
    super(`Przyjęcie ${intakeId} zostało już zeskanowane`);
    this.name = "WarehouseIntakeDuplicateError";
  }
}

export async function applyWarehouseIntake(payload: WarehouseIntakePayload) {
  const existing = await prisma.warehouseIntake.findUnique({
    where: { intakeId: payload.intakeId },
  });
  if (existing) {
    throw new WarehouseIntakeDuplicateError(payload.intakeId);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const results: Array<{
      name: string;
      quantity: number;
      added: number;
      unit: string | null;
    }> = [];

    for (const item of payload.items) {
      const unit = item.unit ?? "szt";
      const stock = await tx.warehouseStock.upsert({
        where: { name: item.name },
        create: {
          name: item.name,
          quantity: item.quantity,
          unit,
        },
        update: {
          quantity: { increment: item.quantity },
          unit,
        },
      });
      results.push({
        name: stock.name,
        quantity: stock.quantity,
        added: item.quantity,
        unit: stock.unit,
      });
    }

    await tx.warehouseIntake.create({
      data: {
        intakeId: payload.intakeId,
        label: payload.label ?? null,
        items: payload.items,
      },
    });

    return results;
  });

  return {
    ok: true as const,
    intakeId: payload.intakeId,
    updated,
  };
}
