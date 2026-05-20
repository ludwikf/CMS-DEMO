"use client";

import { OrderWithItems } from "@/app/types/order";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowDownToLine } from "lucide-react";
import React, { useState } from "react";
import { OrderStatusDialog } from "../components/OrderStatusDialog";
import { OrderDetailTable } from "@/app/(UserPanel)/zamowienia/zamowienie/[id]/OrderDetailTable";

type StatusKey =
  | "unconfirmed"
  | "confirmed"
  | "inProgress"
  | "delivery"
  | "pickup"
  | "finished"
  | "cancelled";

const STATUS_LABELS: Record<StatusKey, string> = {
  unconfirmed: "Niepotwierdzone",
  confirmed: "Potwierdzone",
  inProgress: "W trakcie realizacji",
  delivery: "Wysłane",
  pickup: "Do odbioru",
  finished: "Zakończone",
  cancelled: "Anulowane",
};

const STATUS_DESCRIPTIONS: Record<StatusKey, string> = {
  unconfirmed:
    "Zamówienie czeka na potwierdzenie przez sklep (administratora).",
  confirmed: "Zamówienie zostało potwierdzone przez sklep.",
  inProgress:
    "Zamówienie jest w trakcie realizacji (produkcja lub przygotowanie).",
  delivery: "Zamówienie zostało wysłane – czeka na dostawę.",
  pickup: "Zamówienie jest gotowe do odbioru osobistego w sklepie.",
  finished: "Zamówienie zakończone (odebrane lub dostarczone).",
  cancelled: "Zamówienie zostało anulowane.",
};

type CustomerData = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  nip?: string | null;
};

type ShippingAddressData = {
  city?: string | null;
  address?: string | null;
  zipCode?: string | null;
  apartment?: string | null;
  localNumber?: string | null;
  deliveryNotes?: string | null;
};

type AdminOrderDetail = OrderWithItems & {
  userEmail?: string | null;
  finishedAt?: string | null;
  customer?: CustomerData | null;
  shipping?: ShippingAddressData | null;
  city?: string | null;
  address?: string | null;
  zipCode?: string | null;
  apartment?: string | null;
  localNumber?: string | null;
  deliveryNotes?: string | null;
};

type OrderProps = {
  order: AdminOrderDetail;
  onStatusChange?: () => void | Promise<void>;
};

function formatCurrency(value: number) {
  return value.toLocaleString("pl-PL", { style: "currency", currency: "PLN" });
}

function StatusBadge({ status }: { status: string }) {
  const key = status as StatusKey;
  const label =
    status === "delivery"
      ? "Wysłane"
      : status === "pickup"
      ? "Do odbioru"
      : STATUS_LABELS[key] ?? status;
  const desc = STATUS_DESCRIPTIONS[key] ?? "";

  const badgeClass =
    status === "unconfirmed"
      ? "bg-gray-200 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400"
      : status === "cancelled"
      ? "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400"
      : status === "confirmed" || status === "inProgress"
      ? "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300"
      : status === "delivery" || status === "pickup"
      ? "bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300"
      : "bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-300";

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`whitespace-nowrap py-1 px-2 rounded-lg font-medium text-sm inline-block cursor-default ${badgeClass}`}
          >
            {label}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-[260px]">{desc}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function AdminOrderSum({ order, onStatusChange }: OrderProps) {
  const [downloadLoading, setDownloadLoading] = useState(false);

  const handleDownloadXlsx = async () => {
    try {
      setDownloadLoading(true);
      const res = await fetch("/api/admin/orders/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: order.items,
          orderDetails: {
            orderNumber: order.orderNumber,
            orderName: order.orderName,
            deliveryMethod: order.deliveryMethod,
            createdAt: order.createdAt,
          },
        }),
      });
      if (!res.ok) throw new Error("Błąd pobierania");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Zamówienie-${order.orderNumber}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {    } finally {
      setDownloadLoading(false);
    }
  };

  const customer = order.customer;
  const shippingAddr = order.shipping ?? {
    city: order.city,
    address: order.address,
    zipCode: order.zipCode,
    apartment: order.apartment,
    localNumber: order.localNumber,
    deliveryNotes: order.deliveryNotes,
  };
  const hasDeliveryAddress =
    order.deliveryMethod !== "pickup" &&
    (shippingAddr?.city || shippingAddr?.address || shippingAddr?.zipCode);
  const hasAnyCustomerData =
    customer &&
    (customer.firstName ||
      customer.lastName ||
      customer.email ||
      customer.phone ||
      customer.company ||
      customer.nip);

  return (
    <div className="flex flex-col h-full min-h-0 w-full">
      <div className="w-full flex-1 flex flex-col min-h-0">
        <Card className="w-full h-full rounded-2xl border border-solid dark:bg-[#1e1e1e] px-2 relative flex flex-col min-h-0">
          <CardContent className="px-3 pb-2 flex flex-col flex-1 min-h-0 overflow-y-auto">
            <div className="pt-5 sm:pt-6 pb-5  space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base font-medium text-foreground">
                  Nr {order.orderNumber}
                  {order.orderName ? (
                    <span className="text-muted-foreground font-normal">
                      {" "}
                      · {order.orderName}
                    </span>
                  ) : null}
                </p>
                <StatusBadge status={order.status} />
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <span>
                  <span className="text-muted-foreground">Data złożenia: </span>
                  <span className="text-foreground">
                    {new Date(order.createdAt).toLocaleString("pl-PL", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </span>
                <span>
                  <span className="text-muted-foreground">
                    Sposób dostawy:{" "}
                  </span>
                  <span className="text-foreground">
                    {order.deliveryMethod === "pickup"
                      ? "Odbiór osobisty"
                      : "Dostawa"}
                  </span>
                </span>
                {order.userEmail && (
                  <span>
                    <span className="text-muted-foreground">Klient: </span>
                    <span className="text-foreground">{order.userEmail}</span>
                  </span>
                )}
                {order.status === "finished" && order.finishedAt && (
                  <span>
                    <span className="text-muted-foreground">Zakończono: </span>
                    <span className="text-foreground">
                      {new Date(order.finishedAt).toLocaleString("pl-PL", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <OrderStatusDialog
                  orderId={order.id}
                  frontendStatus={order.status}
                  deliveryMethod={
                    order.deliveryMethod === "pickup" ? "pickup" : "delivery"
                  }
                  onSuccess={onStatusChange}
                  trigger={
                    <Button variant="default" size="sm" className="h-9">
                      Zmień status
                    </Button>
                  }
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 gap-1.5"
                      disabled={downloadLoading}
                    >
                      <ArrowDownToLine className="w-4 h-4" />
                      Pobierz
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel>Format pliku</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={handleDownloadXlsx}
                    >
                      Excel (.xlsx)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {(hasAnyCustomerData || hasDeliveryAddress || order.userEmail) && (
              <div className="w-full flex flex-col gap-2">
                <div className="px-0 pb-1">
                  <span className="font-semibold text-panel-title">
                    Dane klienta
                  </span>
                </div>
                <div className="rounded-xl border border-border bg-[#fcfcfc] dark:bg-[#282828] overflow-hidden">
                  <div className="px-4 pb-4 pt-3 flex flex-col gap-6">
                    {(hasAnyCustomerData || order.userEmail) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        {(customer?.firstName || customer?.lastName) && (
                          <>
                            {customer.firstName && (
                              <div>
                                <div className="text-xs text-muted-foreground mb-0.5">
                                  Imię
                                </div>
                                <div className="text-[#444] dark:text-[#c6c6c6]">
                                  {customer.firstName}
                                </div>
                              </div>
                            )}
                            {customer.lastName && (
                              <div>
                                <div className="text-xs text-muted-foreground mb-0.5">
                                  Nazwisko
                                </div>
                                <div className="text-[#444] dark:text-[#c6c6c6]">
                                  {customer.lastName}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                        <div>
                          <div className="text-xs text-muted-foreground mb-0.5">
                            E-mail
                          </div>
                          <div className="text-[#444] dark:text-[#c6c6c6]">
                            {customer?.email ?? order.userEmail ?? "—"}
                          </div>
                        </div>
                        {customer && (
                          <div>
                            <div className="text-xs text-muted-foreground mb-0.5">
                              Telefon
                            </div>
                            <div className="text-[#444] dark:text-[#c6c6c6]">
                              {customer.phone ?? "—"}
                            </div>
                          </div>
                        )}
                        {customer?.company && (
                          <div>
                            <div className="text-xs text-muted-foreground mb-0.5">
                              Firma
                            </div>
                            <div className="text-[#444] dark:text-[#c6c6c6]">
                              {customer.company}
                            </div>
                          </div>
                        )}
                        {customer?.nip && (
                          <div>
                            <div className="text-xs text-muted-foreground mb-0.5">
                              NIP
                            </div>
                            <div className="text-[#444] dark:text-[#c6c6c6]">
                              {customer.nip}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {hasDeliveryAddress && shippingAddr && (
                      <div>
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                          Adres dostawy
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          {shippingAddr.city && (
                            <div>
                              <div className="text-xs text-muted-foreground mb-0.5">
                                Miasto
                              </div>
                              <div className="text-[#444] dark:text-[#c6c6c6]">
                                {shippingAddr.city}
                              </div>
                            </div>
                          )}
                          {shippingAddr.address && (
                            <div>
                              <div className="text-xs text-muted-foreground mb-0.5">
                                Ulica
                              </div>
                              <div className="text-[#444] dark:text-[#c6c6c6]">
                                {shippingAddr.address}
                              </div>
                            </div>
                          )}
                          {shippingAddr.zipCode && (
                            <div>
                              <div className="text-xs text-muted-foreground mb-0.5">
                                Kod pocztowy
                              </div>
                              <div className="text-[#444] dark:text-[#c6c6c6]">
                                {shippingAddr.zipCode}
                              </div>
                            </div>
                          )}
                          {shippingAddr.apartment && (
                            <div>
                              <div className="text-xs text-muted-foreground mb-0.5">
                                Mieszkanie
                              </div>
                              <div className="text-[#444] dark:text-[#c6c6c6]">
                                {shippingAddr.apartment}
                              </div>
                            </div>
                          )}
                          {shippingAddr.localNumber && (
                            <div>
                              <div className="text-xs text-muted-foreground mb-0.5">
                                Nr lokalu
                              </div>
                              <div className="text-[#444] dark:text-[#c6c6c6]">
                                {shippingAddr.localNumber}
                              </div>
                            </div>
                          )}
                          {shippingAddr.deliveryNotes && (
                            <div className="sm:col-span-2 lg:col-span-3">
                              <div className="text-xs text-muted-foreground mb-0.5">
                                Uwagi do dostawy
                              </div>
                              <div className="text-[#444] dark:text-[#c6c6c6] whitespace-pre-wrap">
                                {shippingAddr.deliveryNotes}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="w-full flex flex-col gap-2 pt-4 pb-2">
              <div className="px-0 pb-1">
                <span className="font-semibold text-panel-title">
                  Zamówione produkty
                </span>
              </div>
              {order.items.length > 0 ? (
                <OrderDetailTable items={order.items} />
              ) : (
                <p className="text-sm text-muted-foreground py-4">
                  Brak pozycji w zamówieniu.
                </p>
              )}

              {typeof order.totalAmount === "number" && (
                <div className="pt-4 mt-2 border-t border-border">
                  <div className="flex justify-end items-baseline gap-2">
                    <span className="text-sm text-muted-foreground">
                      Razem:
                    </span>
                    <span className="text-lg font-semibold text-foreground">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
