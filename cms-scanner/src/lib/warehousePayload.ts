import { z } from "zod";

export const warehouseItemSchema = z.object({
  name: z.string().min(1).max(200),
  quantity: z.number().int().positive(),
  unit: z.string().max(20).optional(),
});

export const warehouseIntakePayloadSchema = z.object({
  v: z.literal(1),
  intakeId: z.string().min(1).max(100),
  label: z.string().max(200).optional(),
  items: z.array(warehouseItemSchema).min(1).max(50),
});

export type WarehouseItem = z.infer<typeof warehouseItemSchema>;
export type WarehouseIntakePayload = z.infer<typeof warehouseIntakePayloadSchema>;

export function parseWarehouseQr(data: string): WarehouseIntakePayload {
  const json = JSON.parse(data);
  const parsed = warehouseIntakePayloadSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Nieprawidłowy format kodu QR magazynu");
  }
  return parsed.data;
}
