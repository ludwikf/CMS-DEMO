export const OrderStatus = {
  DRAFT: "DRAFT",
  UNCONFIRMED: "UNCONFIRMED",
  IN_PROGRESS: "IN_PROGRESS",
  CONFIRMED: "CONFIRMED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  FINISHED: "FINISHED",
  PENDING: "PENDING",
} as const;

export type OrderStatusValue = (typeof OrderStatus)[keyof typeof OrderStatus];

export namespace PrismaJson {
  export type Value = string | number | boolean | null | JsonObject | JsonArray;
  export type JsonArray = Value[];
  export type JsonObject = { [key: string]: Value };
}
