"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

const STORAGE_KEY = "place-order-pending";

type OrderSummary = {
  id: string;
  orderNumber: string;
  totalAmount: number;
};

type PendingData = {
  orders: OrderSummary[];
  totalAmount: number;
};

export default function OczekujeContent() {
  const [data, setData] = useState<PendingData | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PendingData;
      if (
        Array.isArray(parsed?.orders) &&
        typeof parsed?.totalAmount === "number"
      ) {
        setData({
          orders: parsed.orders,
          totalAmount: parsed.totalAmount,
        });
      }
    } catch {}
  }, []);

  const orders = data?.orders ?? [];

  return (
    <div className="w-full flex flex-col items-center px-12">
      <div className="w-full sm:mt-5 mb-10">
        <div className="hidden sm:flex flex-col gap-1 mb-5">
          <div className="text-xl lg:text-3xl font-bold text-panel-title">
            Zamówienie złożone – wycena indywidualna
          </div>
          <div className="text-panel-textMuted text-sm lg:text-base">
            Kwota wymaga indywidualnej wyceny. Po jej zatwierdzeniu poinformujemy Cię e‑mailem.
          </div>
        </div>
        <div className="sm:hidden mb-3 flex flex-col gap-1">
          <span className="text-lg font-bold text-panel-title">
            Zamówienie złożone
          </span>
          <span className="text-sm text-panel-textMuted">
            Wycena indywidualna – poinformujemy e‑mailem
          </span>
        </div>

        <Card className="w-full rounded-2xl border border-solid dark:bg-[#1e1e1e] px-2">
          <CardContent className="px-3 py-6 flex flex-col gap-6">
            <div className="flex items-center gap-3 text-panel-title">
              <Clock className="w-8 h-8 text-amber-600 dark:text-amber-500 shrink-0" />
              <div>
                <p className="font-semibold text-lg">
                  Oczekuje na wycenę
                </p>
                <p className="text-sm text-muted-foreground">
                  Jedna lub więcej pozycji wymaga indywidualnej wyceny. Gdy kwota zostanie zatwierdzona, prześlemy na podany adres e‑mail dane do przelewu oraz informację o kwocie do zapłaty.
                </p>
              </div>
            </div>

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
                      <span className="text-muted-foreground text-xs">
                        wycena w przygotowaniu
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-lg border border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/30 px-4 py-3 text-sm text-[#444] dark:text-[#e5e5e5]">
              Nie wykonuj przelewu przed otrzymaniem od nas potwierdzenia kwoty i danych do płatności. Skontaktujemy się z Tobą e‑mailem.
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
