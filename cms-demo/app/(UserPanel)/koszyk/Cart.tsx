"use client";

import { getProductDisplayName } from "@/app/dictionary/dictionary";
import { useCart } from "@/app/contexts/CartContext";
import { IndividualQuoteTooltip } from "@/app/components/IndividualQuoteTooltip";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import React from "react";
import { Pencil, ShoppingBag, Trash2 } from "lucide-react";

function formatCurrency(value: number) {
  return value.toLocaleString("pl-PL", { style: "currency", currency: "PLN" });
}

function pluralize(count: number, one: string, few: string, many: string) {
  if (count === 1) return one;
  if (count >= 2 && count <= 4) return few;
  return many;
}

export default function Cart() {
  const {
    items,
    removeItem,
    isSelected,
    toggleSelected,
    selectAll,
    deselectAll,
    selectedItems,
    selectedTotalAmount,
    selectedTotalConfigurationsCount,
    cartLoading,
  } = useCart();

  if (cartLoading) {
    return (
      <div className="w-full flex flex-col items-center px-12">
        <div className="w-full sm:mt-5 mb-10 flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="w-full flex flex-col items-center px-12">
        <div className="w-full sm:mt-5 mb-10">
          <div className="hidden sm:flex flex-col gap-1 mb-5">
            <div className="text-xl lg:text-3xl font-bold text-panel-title">
              Koszyk
            </div>
            <div className="text-panel-textMuted text-sm lg:text-base">
              Zamówienia w koszyku
            </div>
          </div>
          <div className="sm:hidden mb-3 flex flex-col gap-1">
            <span className="text-lg font-bold text-panel-title">Koszyk</span>
            <span className="text-sm text-panel-textMuted">
              Zamówienia w koszyku
            </span>
          </div>

          <Card className="w-full rounded-2xl border border-solid dark:bg-[#1e1e1e] px-2">
            <CardContent className="px-3 py-12 flex flex-col items-center justify-center text-center">
              <p className="text-panel-title font-semibold text-lg mb-1">
                Twój koszyk jest pusty
              </p>
              <p className="text-panel-textMuted text-sm mb-5 max-w-sm">
                Skonfiguruj nowy produkt i dodaj go do koszyka.
              </p>
              <Button asChild>
                <Link href="/nowe-zamowienie" className="gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  Nowe zamówienie
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center px-12">
      <div className="w-full sm:mt-5 mb-10">
        <div className="hidden sm:flex flex-col gap-1 mb-5">
          <div className="text-xl lg:text-3xl font-bold text-panel-title">
            Koszyk
          </div>
          <div className="text-panel-textMuted text-sm lg:text-base">
            {items.length}{" "}
            {pluralize(items.length, "zamówienie", "zamówienia", "zamówień")} ·
            zaznacz, które przejdą do podsumowania
          </div>
        </div>
        <div className="sm:hidden mb-3 flex flex-col gap-1">
          <span className="text-lg font-bold text-panel-title">Koszyk</span>
          <span className="text-sm text-panel-textMuted">
            {items.length}{" "}
            {pluralize(items.length, "zamówienie", "zamówienia", "zamówień")}
          </span>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <Card className="flex-1 w-full rounded-2xl border border-solid dark:bg-[#1e1e1e] px-2 relative flex flex-col min-h-0">
            <CardContent className="px-3 pb-5 flex flex-col flex-1 min-h-0">
              <div className="pt-5 sm:pt-3 pb-3 flex-shrink-0 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-muted-foreground"
                  onClick={selectAll}
                >
                  Zaznacz wszystkie
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-muted-foreground"
                  onClick={deselectAll}
                >
                  Odznacz wszystkie
                </Button>
              </div>
              <div className="space-y-3">
                {items.map((entry) => {
                  const selected = isSelected(entry.id);
                  const variantsCount = entry.products.length;
                  const configsCount = entry.products.reduce(
                    (s, p) => s + (p.configurations?.length ?? 0),
                    0
                  );
                  const productNames = entry.products
                    .map((p) =>
                      p.variant != null ? getProductDisplayName(p.variant) : ""
                    )
                    .filter(Boolean);
                  const summaryLabel =
                    variantsCount +
                    " " +
                    pluralize(
                      variantsCount,
                      "wariant",
                      "warianty",
                      "wariantów"
                    ) +
                    " · " +
                    configsCount +
                    " " +
                    pluralize(
                      configsCount,
                      "konfiguracja",
                      "konfiguracje",
                      "konfiguracji"
                    ) +
                    (productNames.length > 0
                      ? " · " + productNames.join(", ")
                      : "");

                  return (
                    <div
                      key={entry.id}
                      className={`rounded-xl border border-border bg-[#f6f6f6] dark:bg-[#282828] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-opacity ${
                        selected ? "opacity-100" : "opacity-45"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Checkbox
                          id={`cart-${entry.id}`}
                          checked={selected}
                          onCheckedChange={() => toggleSelected(entry.id)}
                          className="mt-0.5 shrink-0 w-5 h-5"
                        />
                        <div className="min-w-0 flex-1 max-w-[320px] sm:max-w-md">
                          <div
                            className="font-semibold text-panel-title truncate flex items-center gap-1.5 flex-wrap"
                            title={
                              entry.orderName || entry.orderNumber
                                ? `${entry.orderName ?? ""} ${
                                    entry.orderNumber ?? ""
                                  }`.trim()
                                : summaryLabel
                            }
                          >
                            {entry.orderName || entry.orderNumber ? (
                              <>
                                {entry.orderName && (
                                  <span>{entry.orderName}</span>
                                )}
                                {entry.orderName && entry.orderNumber && (
                                  <span>·</span>
                                )}
                                {entry.orderNumber && (
                                  <span className="text-sm opacity-60">
                                    {entry.orderNumber}
                                  </span>
                                )}
                              </>
                            ) : (
                              summaryLabel
                            )}
                          </div>
                          <div className="text-sm font-medium text-[#444] dark:text-[#c6c6c6] mt-1 flex items-center gap-1.5">
                            {entry.totalAmount !== 0 &&
                              formatCurrency(entry.totalAmount)}
                            {entry.products.some((p) =>
                              (p.configurations ?? []).some(
                                (c) => c.needsIndividualQuote
                              )
                            ) && (
                              <IndividualQuoteTooltip
                                variant={
                                  entry.totalAmount === 0 ? "single" : "sum"
                                }
                              />
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 sm:pl-4">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-9 gap-1.5 text-muted-foreground hover:text-foreground dark:bg-[#282828]"
                          asChild
                        >
                          <Link
                            href={`/nowe-zamowienie/zamowienie?edit=${entry.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                            Edytuj
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            removeItem(entry.id).catch(() => {                            });
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="w-full lg:w-80 rounded-2xl border border-solid dark:bg-[#1e1e1e] px-2 h-fit flex-shrink-0">
            <CardContent className="px-3 py-5">
              <div className="text-lg font-semibold text-panel-title mb-3">
                Podsumowanie
              </div>
              <div className="text-sm text-panel-textMuted space-y-1 mb-4">
                <div className="flex justify-between">
                  <span>Zamówienia (zaznaczone)</span>
                  <span className="text-[#444] dark:text-[#c6c6c6]">
                    {selectedItems.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Pozycje łącznie</span>
                  <span className="text-[#444] dark:text-[#c6c6c6]">
                    {selectedTotalConfigurationsCount}
                  </span>
                </div>
                <div className="flex justify-between font-medium text-panel-title pt-2 border-t border-border mt-2">
                  <span>Suma</span>
                  <span>{formatCurrency(selectedTotalAmount)}</span>
                </div>
              </div>
              {selectedItems.length > 0 ? (
                <Button className="w-full mb-2" asChild>
                  <Link href="/koszyk/podsumowanie">
                    Przejdź do podsumowania
                  </Link>
                </Button>
              ) : (
                <Button className="w-full mb-2" disabled>
                  Przejdź do podsumowania
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
