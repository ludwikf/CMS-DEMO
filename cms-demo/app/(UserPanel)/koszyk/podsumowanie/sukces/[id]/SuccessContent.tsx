"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";

const STORAGE_KEY = "place-order-success";

function formatCurrency(value: number) {
  return value.toLocaleString("pl-PL", { style: "currency", currency: "PLN" });
}

function formatOrderNumberFromId(id: string): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  const datePart = `${dd}${mm}${yyyy}`;
  const digits = id.replace(/\D/g, "").slice(-5);
  const numPart = digits ? digits.padStart(5, "0") : "00001";
  return `Z/${datePart}/${numPart}`;
}

const BANK_ACCOUNT = "XX XXXX XXXX XXXX XXXX XXXX XXXX XXXX";
const BANK_RECIPIENT = "CMS Demo";

type OrderSummary = {
  id: string;
  orderNumber: string;
  totalAmount: number;
};

type SuccessData = {
  orders: OrderSummary[];
  totalAmount: number;
  requiresIndividualQuote?: boolean;
};

type SuccessContentProps = {
  orderId: string;
  orderName?: string | null;
  amount?: number | null;
};

export default function SuccessContent({
  orderId,
  orderName,
  amount,
}: SuccessContentProps) {
  const router = useRouter();
  const [successData, setSuccessData] = useState<SuccessData | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as SuccessData;
      if (parsed?.requiresIndividualQuote === true) {
        try {
          sessionStorage.setItem(
            "place-order-pending",
            JSON.stringify({
              orders: parsed.orders ?? [],
              totalAmount: parsed.totalAmount ?? 0,
            })
          );
        } catch {}
        router.replace("/koszyk/podsumowanie/oczekuje");
        return;
      }
      if (
        Array.isArray(parsed?.orders) &&
        typeof parsed?.totalAmount === "number"
      ) {
        setSuccessData({
          orders: parsed.orders,
          totalAmount: parsed.totalAmount,
        });
      }
    } catch {}
  }, [router]);

  const orders = successData?.orders ?? [];
  const totalAmount = successData?.totalAmount ?? amount ?? 0;
  const firstOrder = orders[0];
  const transferTitle =
    firstOrder?.orderNumber ?? formatOrderNumberFromId(orderId);
  const hasMultiple = orders.length > 1;

  return (
    <div className="w-full flex flex-col items-center px-12">
      <div className="w-full sm:mt-5 mb-10">
        <div className="hidden sm:flex flex-col gap-1 mb-5">
          <div className="text-xl lg:text-3xl font-bold text-panel-title">
            Zamówienie złożone
          </div>
          <div className="text-panel-textMuted text-sm lg:text-base">
            {hasMultiple
              ? `Złożono ${orders.length} zamówienia. Płatność przelewem – dane poniżej.`
              : "Dziękujemy. Płatność przelewem – dane poniżej."}
          </div>
        </div>
        <div className="sm:hidden mb-3 flex flex-col gap-1">
          <span className="text-lg font-bold text-panel-title">
            Zamówienie złożone
          </span>
          <span className="text-sm text-panel-textMuted">
            Dane do przelewu poniżej
          </span>
        </div>

        <Card className="w-full rounded-2xl border border-solid dark:bg-[#1e1e1e] px-2">
          <CardContent className="px-3 py-6 flex flex-col gap-6">
            {orders.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-panel-title mb-3">
                  Złożone zamówienia
                </h3>
                <ul className="space-y-2 rounded-lg border border-border bg-[#f9f9f9] dark:bg-[#252525] divide-y divide-border">
                  {orders.map((o) => (
                    <li
                      key={o.id}
                      className="flex items-center justify-between px-4 py-3 text-sm"
                    >
                      <span className="font-mono text-[#444] dark:text-[#c6c6c6] tabular-nums">
                        Nr {o.orderNumber}
                      </span>
                      <span className="font-semibold text-panel-title">
                        {formatCurrency(o.totalAmount)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between items-center mt-3 px-1 text-base font-semibold text-panel-title">
                  <span>Suma do zapłaty</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/30 px-4 py-3 text-sm text-[#444] dark:text-[#e5e5e5]">
              Zamówienie należy opłacić przelewem. Po zaksięgowaniu płatności
              zostanie potwierdzone i rozpocznie się realizacja. Skontaktujemy
              się w razie pytań.
            </div>

            <div>
              <h3 className="text-base font-semibold text-panel-title mb-4">
                Dane do przelewu
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="rounded-lg border border-border bg-[#f9f9f9] dark:bg-[#252525] p-3">
                  <div className="text-xs text-muted-foreground mb-0.5">
                    Numer konta
                  </div>
                  <div className="font-mono text-[#444] dark:text-[#c6c6c6] break-all">
                    {BANK_ACCOUNT}
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-[#f9f9f9] dark:bg-[#252525] p-3">
                  <div className="text-xs text-muted-foreground mb-0.5">
                    Tytuł przelewu
                  </div>
                  <div className="font-mono text-[#444] dark:text-[#c6c6c6] break-all">
                    {transferTitle}
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-[#f9f9f9] dark:bg-[#252525] p-3">
                  <div className="text-xs text-muted-foreground mb-0.5">
                    Kwota do zapłaty
                  </div>
                  <div className="text-[#444] dark:text-[#c6c6c6] font-semibold">
                    {formatCurrency(totalAmount)}
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-[#f9f9f9] dark:bg-[#252525] p-3">
                  <div className="text-xs text-muted-foreground mb-0.5">
                    Odbiorca
                  </div>
                  <div className="text-[#444] dark:text-[#c6c6c6]">
                    {BANK_RECIPIENT}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6">
          <Button asChild variant="outline">
            <Link href="/">Powrót na stronę główną</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
