import { describe, it, expect } from "vitest";
import {
  validatePlaceOrderPayload,
  buildDeliveryPayload,
  buildPersonalPayload,
} from "@/lib/order-summary";

const validPersonal = {
  firstName: "Anna",
  lastName: "Kowalska",
  email: "anna@example.com",
  phone: "500300400",
};

describe("order-summary validation and payload builders", () => {
  it("accepts a valid pickup order", () => {
    const result = validatePlaceOrderPayload({
      cartItemIds: ["order-1"],
      personal: validPersonal,
      delivery: { method: "pickup" },
    });

    expect(result.success).toBe(true);
  });

  it("accepts a valid delivery order", () => {
    const result = validatePlaceOrderPayload({
      cartItemIds: ["order-1", "order-2"],
      personal: validPersonal,
      delivery: {
        method: "delivery",
        city: "Kraków",
        zipCode: "30-001",
        address: "ul. Testowa 10",
      },
    });

    expect(result.success).toBe(true);
  });

  it("rejects delivery order when required address fields are missing", () => {
    const result = validatePlaceOrderPayload({
      cartItemIds: ["order-1"],
      personal: validPersonal,
      delivery: {
        method: "delivery",
        city: "",
        zipCode: "30-001",
        address: "",
      },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors["delivery.city"]).toBeTruthy();
      expect(result.fieldErrors["delivery.zipCode"]).toBeTruthy();
      expect(result.fieldErrors["delivery.address"]).toBeTruthy();
    }
  });

  it("rejects empty cartItemIds and invalid email", () => {
    const result = validatePlaceOrderPayload({
      cartItemIds: [],
      personal: { ...validPersonal, email: "invalid-email" },
      delivery: { method: "pickup" },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors["cartItemIds"]).toBeTruthy();
      expect(result.fieldErrors["personal.email"]).toBeTruthy();
    }
  });

  it("builds trimmed personal and delivery payloads", () => {
    expect(
      buildPersonalPayload({
        firstName: "  Jan ",
        lastName: " Nowak ",
        email: " jan@example.com ",
        phone: " 123456789 ",
        company: "   ",
        nip: " 1234567890 ",
      })
    ).toEqual({
      firstName: "Jan",
      lastName: "Nowak",
      email: "jan@example.com",
      phone: "123456789",
      nip: "1234567890",
    });

    expect(
      buildDeliveryPayload({
        method: "pickup",
        city: "Warszawa",
        zipCode: "00-001",
        address: "ul. A",
        apartment: "1",
        localNumber: "2",
        deliveryNotes: "test",
      })
    ).toEqual({ method: "pickup" });

    expect(
      buildDeliveryPayload({
        method: "delivery",
        city: " Warszawa ",
        zipCode: " 00-001 ",
        address: " ul. A ",
        apartment: "  ",
        localNumber: "",
        deliveryNotes: " Kod do bramy 12 ",
      })
    ).toEqual({
      method: "delivery",
      city: "Warszawa",
      zipCode: "00-001",
      address: "ul. A",
      apartment: undefined,
      localNumber: undefined,
      deliveryNotes: "Kod do bramy 12",
    });
  });
});
