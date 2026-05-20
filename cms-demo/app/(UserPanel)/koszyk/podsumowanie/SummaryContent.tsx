"use client";

import { getProductDisplayName } from "@/app/dictionary/dictionary";
import { useCart } from "@/app/contexts/CartContext";
import type { CartEntry } from "@/app/contexts/CartContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useRef, useEffect } from "react";
import { User } from "lucide-react";
import { IndividualQuoteTooltip } from "@/app/components/IndividualQuoteTooltip";
import { cn } from "@/lib/utils";
import {
  defaultOrderSummaryPersonal,
  defaultOrderSummaryDeliveryFormState,
  buildPersonalPayload,
  buildDeliveryPayload,
  validatePlaceOrderPayload,
} from "@/lib/order-summary";
import { ProductConfigSummaryTable } from "./ProductConfigSummaryTable";

function formatCurrency(value: number) {
  return value.toLocaleString("pl-PL", { style: "currency", currency: "PLN" });
}

function formatOrderNumber(entryId: string, index: number): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  const datePart = `${dd}${mm}${yyyy}`;
  const digits = entryId.replace(/\D/g, "").slice(-5);
  const numPart = digits
    ? digits.padStart(5, "0")
    : String(index + 1).padStart(5, "0");
  return `Z/${datePart}/${numPart}`;
}

function getVariantNamesPreview(entry: CartEntry): string {
  const names = entry.products.map((p) => getProductDisplayName(p.variant));
  return names.join(", ");
}

function entryHasIndividualQuote(entry: CartEntry): boolean {
  return entry.products.some((p) =>
    (p.configurations ?? []).some((c) => c.needsIndividualQuote)
  );
}

const inputClass =
  "bg-[#fcfcfc] dark:bg-[#252525] border-[#ccc] dark:border-[#555]";
const inputErrorClass =
  "border-destructive focus-visible:ring-destructive dark:border-destructive";

export default function SummaryContent() {
  const { selectedItems, selectedTotalAmount, refreshCart, cartLoading } =
    useCart();
  const [personal, setPersonal] = useState(defaultOrderSummaryPersonal);
  const [delivery, setDelivery] = useState(defaultOrderSummaryDeliveryFormState);
  const [paymentMethod, setPaymentMethod] = useState<"transfer">("transfer");
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const formSectionRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const placingSnapshotRef = useRef<{
    items: CartEntry[];
    total: number;
  } | null>(null);
  const [displaySnapshot, setDisplaySnapshot] = useState<{
    items: CartEntry[];
    total: number;
  } | null>(null);

  useEffect(() => {
    if (
      !cartLoading &&
      selectedItems.length > 0 &&
      !displaySnapshot &&
      !placing
    ) {
      setDisplaySnapshot({
        items: selectedItems,
        total: selectedTotalAmount,
      });
    }
  }, [
    cartLoading,
    selectedItems,
    selectedTotalAmount,
    displaySnapshot,
    placing,
  ]);

  if (cartLoading && !displaySnapshot) {
    return (
      <div className="w-full flex flex-col items-center px-12">
        <div className="w-full sm:mt-5 mb-10 flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  const itemsToShow =
    placing && placingSnapshotRef.current
      ? placingSnapshotRef.current.items
      : displaySnapshot
      ? displaySnapshot.items
      : selectedItems;
  const totalToShow =
    placing && placingSnapshotRef.current
      ? placingSnapshotRef.current.total
      : displaySnapshot
      ? displaySnapshot.total
      : selectedTotalAmount;

  const clearFieldError = (key: string) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handlePlaceOrder = async () => {
    setPlaceError(null);
    setFieldErrors({});
    const payload = {
      cartItemIds: selectedItems.map((e) => e.id),
      personal: buildPersonalPayload(personal),
      delivery: buildDeliveryPayload(delivery),
      paymentMethod,
    };
    const validation = validatePlaceOrderPayload(payload);
    if (!validation.success) {
      setFieldErrors(validation.fieldErrors);
      setTimeout(
        () =>
          formSectionRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          }),
        100
      );
      return;
    }

    setPlacing(true);
    placingSnapshotRef.current = {
      items: selectedItems,
      total: selectedTotalAmount,
    };
    try {
      const res: Response = await fetch("/api/cart/place-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setPlaceError(data.error || "Nie udało się złożyć zamówienia.");
        if (data.fields && typeof data.fields === "object") {
          setFieldErrors(data.fields);
        }
        setPlacing(false);
        placingSnapshotRef.current = null;
        return;
      }

      await refreshCart();
      const orders = data.orders ?? [];
      const totalFromApi = typeof data.totalAmount === "number" ? data.totalAmount : totalToShow;
      const requiresIndividualQuote = data.requiresIndividualQuote === true;
      const successPayload = {
        orders: orders.map((o: { id: string; orderNumber: string; totalAmount?: number }) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          totalAmount: o.totalAmount ?? 0,
        })),
        totalAmount: totalFromApi,
      };
      try {
        if (requiresIndividualQuote) {
          sessionStorage.setItem("place-order-pending", JSON.stringify(successPayload));
        } else {
          sessionStorage.setItem(
            "place-order-success",
            JSON.stringify({ ...successPayload, requiresIndividualQuote: false })
          );
        }
      } catch {}
      if (requiresIndividualQuote) {
        router.push("/koszyk/podsumowanie/oczekuje");
      } else {
        const firstOrderId = orders[0]?.id ?? `order-${Date.now()}`;
        const params = new URLSearchParams();
        params.set("amount", String(totalFromApi));
        router.push(
          `/koszyk/podsumowanie/sukces/${encodeURIComponent(firstOrderId)}?${params.toString()}`
        );
      }
      placingSnapshotRef.current = null;
    } catch {
      setPlaceError("Wystąpił błąd. Spróbuj ponownie.");
      setPlacing(false);
      placingSnapshotRef.current = null;
    }
  };

  if (itemsToShow.length === 0) {
    return (
      <div className="w-full flex flex-col items-center px-12">
        <div className="w-full sm:mt-5 mb-10">
          <div className="hidden sm:flex flex-col gap-1 mb-5">
            <div className="text-xl lg:text-3xl font-bold text-panel-title">
              Podsumowanie zamówienia
            </div>
            <div className="text-panel-textMuted text-sm lg:text-base">
              Brak zaznaczonych zamówień w koszyku
            </div>
          </div>
          <Card className="w-full rounded-2xl border border-solid dark:bg-[#1e1e1e] px-2">
            <CardContent className="px-3 py-12 flex flex-col items-center justify-center text-center">
              <p className="text-panel-title font-semibold text-lg mb-1">
                Nie wybrano zamówień
              </p>
              <p className="text-panel-textMuted text-sm mb-6 max-w-sm">
                Wróć do koszyka i zaznacz zamówienia, które chcesz złożyć.
              </p>
              <Button asChild variant="outline">
                <Link href="/koszyk">Wróć do koszyka</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const defaultOpenSections = ["personal-delivery"];

  return (
    <div className="w-full flex flex-col items-center px-12">
      <div className="w-full sm:mt-5 mb-10">
        <div className="hidden sm:flex flex-col gap-1 mb-5">
          <div className="text-xl lg:text-3xl font-bold text-panel-title">
            Podsumowanie zamówienia
          </div>
          <div className="text-panel-textMuted text-sm lg:text-base">
            Dane osobowe i dostawa – przejdź dalej do złożenia
          </div>
        </div>
        <div className="sm:hidden mb-3 flex flex-col gap-1">
          <span className="text-lg font-bold text-panel-title">
            Podsumowanie zamówienia
          </span>
          <span className="text-sm text-panel-textMuted">
            {itemsToShow.length}{" "}
            {itemsToShow.length === 1 ? "zamówienie" : "zamówień"}
          </span>
        </div>

        <Card className="w-full rounded-2xl border border-solid dark:bg-[#1e1e1e] px-[3px]">
          <CardContent className="px-3 py-4 flex flex-col flex-1 min-h-0">
            <Accordion
              type="multiple"
              defaultValue={defaultOpenSections}
              className="w-full flex flex-col gap-2"
            >
              <AccordionItem
                ref={formSectionRef}
                value="personal-delivery"
                className="border border-border bg-[#fcfcfc] dark:bg-[#202020] rounded-lg px-3"
              >
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <span className="sm:text-base font-semibold text-panel-title">
                      Dane osobowe i dostawa
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4 px-1">
                  <div className="space-y-6">
                    <section className="rounded-lg border border-border/60 bg-muted/20 dark:bg-muted/5 p-4">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                        Dane osobowe
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="firstName">Imię</Label>
                          <Input
                            id="firstName"
                            placeholder="Podaj imię"
                            value={personal.firstName}
                            onChange={(e) => {
                              clearFieldError("personal.firstName");
                              setPersonal((p) => ({ ...p, firstName: e.target.value }));
                            }}
                            className={cn(inputClass, fieldErrors["personal.firstName"] && inputErrorClass)}
                            aria-invalid={!!fieldErrors["personal.firstName"]}
                          />
                          {fieldErrors["personal.firstName"] && (
                            <p className="text-sm text-destructive" role="alert">
                              {fieldErrors["personal.firstName"]}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="lastName">Nazwisko</Label>
                          <Input
                            id="lastName"
                            placeholder="Podaj nazwisko"
                            value={personal.lastName}
                            onChange={(e) => {
                              clearFieldError("personal.lastName");
                              setPersonal((p) => ({ ...p, lastName: e.target.value }));
                            }}
                            className={cn(inputClass, fieldErrors["personal.lastName"] && inputErrorClass)}
                            aria-invalid={!!fieldErrors["personal.lastName"]}
                          />
                          {fieldErrors["personal.lastName"] && (
                            <p className="text-sm text-destructive" role="alert">
                              {fieldErrors["personal.lastName"]}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="email">E-mail</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="Podaj adres e-mail"
                            value={personal.email}
                            onChange={(e) => {
                              clearFieldError("personal.email");
                              setPersonal((p) => ({ ...p, email: e.target.value }));
                            }}
                            className={cn(inputClass, fieldErrors["personal.email"] && inputErrorClass)}
                            aria-invalid={!!fieldErrors["personal.email"]}
                          />
                          {fieldErrors["personal.email"] && (
                            <p className="text-sm text-destructive" role="alert">
                              {fieldErrors["personal.email"]}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="phone">Telefon</Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="Podaj numer telefonu"
                            value={personal.phone}
                            onChange={(e) => {
                              clearFieldError("personal.phone");
                              setPersonal((p) => ({ ...p, phone: e.target.value }));
                            }}
                            className={cn(inputClass, fieldErrors["personal.phone"] && inputErrorClass)}
                            aria-invalid={!!fieldErrors["personal.phone"]}
                          />
                          {fieldErrors["personal.phone"] && (
                            <p className="text-sm text-destructive" role="alert">
                              {fieldErrors["personal.phone"]}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="nip">NIP</Label>
                          <Input
                            id="nip"
                            placeholder="Podaj NIP"
                            value={personal.nip}
                            onChange={(e) => {
                              clearFieldError("personal.nip");
                              setPersonal((p) => ({ ...p, nip: e.target.value }));
                            }}
                            className={cn(inputClass, fieldErrors["personal.nip"] && inputErrorClass)}
                            aria-invalid={!!fieldErrors["personal.nip"]}
                          />
                          {fieldErrors["personal.nip"] && (
                            <p className="text-sm text-destructive" role="alert">
                              {fieldErrors["personal.nip"]}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="company">Nazwa firmy</Label>
                          <Input
                            id="company"
                            placeholder="Podaj nazwę firmy (opcjonalnie)"
                            value={personal.company}
                            onChange={(e) => {
                              clearFieldError("personal.company");
                              setPersonal((p) => ({ ...p, company: e.target.value }));
                            }}
                            className={cn(inputClass, fieldErrors["personal.company"] && inputErrorClass)}
                            aria-invalid={!!fieldErrors["personal.company"]}
                          />
                          {fieldErrors["personal.company"] && (
                            <p className="text-sm text-destructive" role="alert">
                              {fieldErrors["personal.company"]}
                            </p>
                          )}
                        </div>
                      </div>
                    </section>

                    <section className="rounded-lg border border-border/60 bg-muted/20 dark:bg-muted/5 p-4">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                        Płatność i dostawa
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                        <div className="space-y-1.5">
                          <Label>Sposób dostawy</Label>
                          <Select
                            value={delivery.method}
                            onValueChange={(v: "delivery" | "pickup") => {
                              if (v === "pickup") {
                                setFieldErrors((prev) => {
                                  const next = { ...prev };
                                  delete next["delivery.city"];
                                  delete next["delivery.zipCode"];
                                  delete next["delivery.address"];
                                  delete next["delivery.apartment"];
                                  delete next["delivery.localNumber"];
                                  delete next["delivery.deliveryNotes"];
                                  return next;
                                });
                              }
                              setDelivery((d) => ({ ...d, method: v }));
                            }}
                          >
                            <SelectTrigger className={inputClass}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="delivery">Dostawa</SelectItem>
                              <SelectItem value="pickup">
                                Odbiór osobisty
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Sposób płatności</Label>
                          <Select
                            value={paymentMethod}
                            onValueChange={(v: "transfer") =>
                              setPaymentMethod(v)
                            }
                          >
                            <SelectTrigger className={inputClass}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="transfer">
                                Przelew krajowy
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {delivery.method === "delivery" && (
                          <>
                            <div className="sm:col-span-2 pt-2">
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                Adres dostawy
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                                <div className="space-y-1.5">
                                  <Label htmlFor="city">Miasto</Label>
                                  <Input
                                    id="city"
                                    placeholder="Podaj miasto"
                                    value={delivery.city}
                                    onChange={(e) => {
                                      clearFieldError("delivery.city");
                                      setDelivery((d) => ({ ...d, city: e.target.value }));
                                    }}
                                    className={cn(inputClass, fieldErrors["delivery.city"] && inputErrorClass)}
                                    aria-invalid={!!fieldErrors["delivery.city"]}
                                  />
                                  {fieldErrors["delivery.city"] && (
                                    <p className="text-sm text-destructive" role="alert">
                                      {fieldErrors["delivery.city"]}
                                    </p>
                                  )}
                                </div>
                                <div className="space-y-1.5">
                                  <Label htmlFor="zipCode">Kod pocztowy</Label>
                                  <Input
                                    id="zipCode"
                                    placeholder="Podaj kod pocztowy"
                                    value={delivery.zipCode}
                                    onChange={(e) => {
                                      clearFieldError("delivery.zipCode");
                                      setDelivery((d) => ({ ...d, zipCode: e.target.value }));
                                    }}
                                    className={cn(inputClass, fieldErrors["delivery.zipCode"] && inputErrorClass)}
                                    aria-invalid={!!fieldErrors["delivery.zipCode"]}
                                  />
                                  {fieldErrors["delivery.zipCode"] && (
                                    <p className="text-sm text-destructive" role="alert">
                                      {fieldErrors["delivery.zipCode"]}
                                    </p>
                                  )}
                                </div>
                                <div className="space-y-1.5 sm:col-span-2">
                                  <Label htmlFor="address">Ulica</Label>
                                  <Input
                                    id="address"
                                    placeholder="Podaj ulicę"
                                    value={delivery.address}
                                    onChange={(e) => {
                                      clearFieldError("delivery.address");
                                      setDelivery((d) => ({ ...d, address: e.target.value }));
                                    }}
                                    className={cn(inputClass, fieldErrors["delivery.address"] && inputErrorClass)}
                                    aria-invalid={!!fieldErrors["delivery.address"]}
                                  />
                                  {fieldErrors["delivery.address"] && (
                                    <p className="text-sm text-destructive" role="alert">
                                      {fieldErrors["delivery.address"]}
                                    </p>
                                  )}
                                </div>
                                <div className="space-y-1.5">
                                  <Label htmlFor="apartment">Nr budynku</Label>
                                  <Input
                                    id="apartment"
                                    placeholder="Podaj nr budynku"
                                    value={delivery.apartment}
                                    onChange={(e) => {
                                      clearFieldError("delivery.apartment");
                                      setDelivery((d) => ({ ...d, apartment: e.target.value }));
                                    }}
                                    className={cn(inputClass, fieldErrors["delivery.apartment"] && inputErrorClass)}
                                    aria-invalid={!!fieldErrors["delivery.apartment"]}
                                  />
                                  {fieldErrors["delivery.apartment"] && (
                                    <p className="text-sm text-destructive" role="alert">
                                      {fieldErrors["delivery.apartment"]}
                                    </p>
                                  )}
                                </div>
                                <div className="space-y-1.5">
                                  <Label htmlFor="localNumber">Nr lokalu</Label>
                                  <Input
                                    id="localNumber"
                                    placeholder="Podaj nr lokalu"
                                    value={delivery.localNumber}
                                    onChange={(e) => {
                                      clearFieldError("delivery.localNumber");
                                      setDelivery((d) => ({ ...d, localNumber: e.target.value }));
                                    }}
                                    className={cn(inputClass, fieldErrors["delivery.localNumber"] && inputErrorClass)}
                                    aria-invalid={!!fieldErrors["delivery.localNumber"]}
                                  />
                                  {fieldErrors["delivery.localNumber"] && (
                                    <p className="text-sm text-destructive" role="alert">
                                      {fieldErrors["delivery.localNumber"]}
                                    </p>
                                  )}
                                </div>
                                <div className="space-y-1.5 sm:col-span-2">
                                  <Label htmlFor="deliveryNotes">
                                    Uwagi do dostawy
                                  </Label>
                                  <Textarea
                                    id="deliveryNotes"
                                    placeholder="Podaj uwagi do dostawy (opcjonalnie)"
                                    value={delivery.deliveryNotes}
                                    onChange={(e) => {
                                      clearFieldError("delivery.deliveryNotes");
                                      setDelivery((d) => ({ ...d, deliveryNotes: e.target.value }));
                                    }}
                                    rows={2}
                                    className={cn(inputClass, "resize-none", fieldErrors["delivery.deliveryNotes"] && inputErrorClass)}
                                    aria-invalid={!!fieldErrors["delivery.deliveryNotes"]}
                                  />
                                  {fieldErrors["delivery.deliveryNotes"] && (
                                    <p className="text-sm text-destructive" role="alert">
                                      {fieldErrors["delivery.deliveryNotes"]}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </section>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="mt-6">
              <h3 className="text-base font-semibold text-panel-title mb-3">
                Produkty
              </h3>
              <Accordion
                type="multiple"
                defaultValue={itemsToShow.map((e) => `order-${e.id}`)}
                className="w-full flex flex-col gap-2"
              >
                {itemsToShow.map((entry, index) => {
                  const displayName =
                    entry.orderName || getVariantNamesPreview(entry);
                  const displayNumber =
                    entry.orderNumber || formatOrderNumber(entry.id, index);
                  return (
                    <AccordionItem
                      key={entry.id}
                      value={`order-${entry.id}`}
                      className="border border-border bg-[#fcfcfc] dark:bg-[#202020] rounded-lg px-3"
                    >
                      <AccordionTrigger className="hover:no-underline py-3 [&>svg]:ml-2">
                        <div className="flex flex-1 min-w-0 flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3 w-full text-left">
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="font-semibold text-panel-title">
                              {displayName}
                            </span>
                            <span
                              className="text-sm text-muted-foreground break-words opacity-60 tabular-nums"
                              title={displayNumber}
                            >
                              {displayNumber}
                            </span>
                          </div>
                          <div className="text-[15px] font-bold text-panel-title shrink-0 sm:ml-2 flex items-center gap-1.5">
                            {entry.totalAmount !== 0 &&
                              formatCurrency(entry.totalAmount)}
                            {entryHasIndividualQuote(entry) && (
                              <IndividualQuoteTooltip
                                variant={
                                  entry.totalAmount === 0 ? "single" : "sum"
                                }
                              />
                            )}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-4">
                        <OrderDetails entry={entry} />
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>

            <div className="mt-3 pt-3 border-t border-border flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-lg font-semibold text-panel-title flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Suma:</span>{" "}
                  {totalToShow !== 0 && formatCurrency(totalToShow)}
                  {itemsToShow.some(entryHasIndividualQuote) && (
                    <IndividualQuoteTooltip
                      variant={totalToShow === 0 ? "single" : "sum"}
                    />
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" asChild disabled={placing}>
                    <Link href="/koszyk">Wróć do koszyka</Link>
                  </Button>
                  <Button onClick={handlePlaceOrder} disabled={placing}>
                    {placing ? "Składanie..." : "Złóż zamówienie"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function OrderDetails({ entry }: { entry: CartEntry }) {
  return (
    <div className="flex flex-col gap-4">
      {entry.products.map((product, pIdx) => (
        <ProductConfigSummaryTable
          key={`${entry.id}-${product.id}-${pIdx}`}
          product={product}
        />
      ))}
    </div>
  );
}
