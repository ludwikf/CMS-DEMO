import { z } from "zod";

export const orderSummaryPersonalSchema = z.object({
  firstName: z.string().min(1, "Imię jest wymagane"),
  lastName: z.string().min(1, "Nazwisko jest wymagane"),
  email: z.string().email("Nieprawidłowy adres e-mail"),
  phone: z.string().min(1, "Telefon jest wymagany"),
  company: z.string().optional(),
  nip: z.string().optional(),
});

export type OrderSummaryPersonal = z.infer<typeof orderSummaryPersonalSchema>;

export const orderSummaryDeliveryAddressSchema = z.object({
  city: z.string().min(1, "Miasto jest wymagane"),
  zipCode: z.string().min(1, "Kod pocztowy jest wymagany"),
  address: z.string().min(1, "Ulica jest wymagana"),
  apartment: z.string().optional(),
  localNumber: z.string().optional(),
  deliveryNotes: z.string().optional(),
});

export type OrderSummaryDeliveryAddress = z.infer<
  typeof orderSummaryDeliveryAddressSchema
>;

export const deliveryMethodSchema = z.enum(["delivery", "pickup"]);

export type DeliveryMethod = z.infer<typeof deliveryMethodSchema>;

export const orderSummaryDeliverySchema = z.discriminatedUnion("method", [
  z.object({
    method: z.literal("pickup"),
  }),
  z.object({
    method: z.literal("delivery"),
    city: z.string().optional(),
    zipCode: z.string().optional(),
    address: z.string().optional(),
    apartment: z.string().optional(),
    localNumber: z.string().optional(),
    deliveryNotes: z.string().optional(),
  }),
]);

export type OrderSummaryDelivery = z.infer<typeof orderSummaryDeliverySchema>;

export const placeOrderBodySchema = z
  .object({
    cartItemIds: z.array(z.string()).min(1, "Wybierz co najmniej jedno zamówienie"),
    personal: orderSummaryPersonalSchema,
    delivery: orderSummaryDeliverySchema,
    paymentMethod: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.delivery.method !== "delivery") return true;
      const d = data.delivery;
      return (
        (d.city?.trim()?.length ?? 0) > 0 &&
        (d.zipCode?.trim()?.length ?? 0) > 0 &&
        (d.address?.trim()?.length ?? 0) > 0
      );
    },
    {
      message: "Przy dostawie uzupełnij miasto, kod pocztowy i ulicę.",
      path: ["delivery"],
    }
  );

export type PlaceOrderPayload = z.infer<typeof placeOrderBodySchema>;

export const defaultOrderSummaryPersonal: OrderSummaryPersonal = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  nip: "",
};

export const defaultOrderSummaryDelivery: OrderSummaryDelivery = {
  method: "pickup",
};

export type OrderSummaryDeliveryFormState = {
  method: DeliveryMethod;
  city: string;
  zipCode: string;
  address: string;
  apartment: string;
  localNumber: string;
  deliveryNotes: string;
};

export const defaultOrderSummaryDeliveryFormState: OrderSummaryDeliveryFormState =
  {
    method: "pickup",
    city: "",
    zipCode: "",
    address: "",
    apartment: "",
    localNumber: "",
    deliveryNotes: "",
  };

export function buildDeliveryPayload(
  form: OrderSummaryDeliveryFormState
): OrderSummaryDelivery {
  if (form.method === "pickup") {
    return { method: "pickup" };
  }
  return {
    method: "delivery",
    city: form.city.trim() || undefined,
    zipCode: form.zipCode.trim() || undefined,
    address: form.address.trim() || undefined,
    apartment: form.apartment.trim() || undefined,
    localNumber: form.localNumber.trim() || undefined,
    deliveryNotes: form.deliveryNotes.trim() || undefined,
  };
}

export function buildPersonalPayload(
  form: OrderSummaryPersonal
): OrderSummaryPersonal {
  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    ...(form.company?.trim() && { company: form.company.trim() }),
    ...(form.nip?.trim() && { nip: form.nip.trim() }),
  };
}

export function formatPlaceOrderValidationErrors(
  error: z.ZodError
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.errors) {
    const path = issue.path.filter((p): p is string => typeof p === "string");
    const key = path.join(".");
    const msg = issue.message;
    if (path.length === 0) continue;
    if (key === "delivery") {
      out["delivery.city"] = msg;
      out["delivery.zipCode"] = msg;
      out["delivery.address"] = msg;
    } else {
      out[key] = msg;
    }
  }
  return out;
}

export function validatePlaceOrderPayload(payload: unknown): {
  success: true;
  data: PlaceOrderPayload;
} | {
  success: false;
  fieldErrors: Record<string, string>;
} {
  const result = placeOrderBodySchema.safeParse(payload);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    fieldErrors: formatPlaceOrderValidationErrors(result.error),
  };
}
