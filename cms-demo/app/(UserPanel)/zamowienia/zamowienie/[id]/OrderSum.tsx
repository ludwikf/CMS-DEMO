"use client";

import { ButtonLoading } from "@/app/components/ButtonLoading";
import GoBackArrow from "@/app/components/GoBackArrow";
import { OrderWithItems } from "@/app/types/order";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { ArrowDownToLine, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useCart } from "@/app/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { OrderDetailTable } from "./OrderDetailTable";

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

type OrderProps = {
  order: OrderWithItems;
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

export default function OrderSum({ order }: OrderProps) {
  const [loading, setLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [reorderDialogOpen, setReorderDialogOpen] = useState(false);
  const [reorderError, setReorderError] = useState<string | null>(null);
  const router = useRouter();
  const { refreshCart } = useCart();
  const { toast } = useToast();

  const canCancel = order.status === "unconfirmed";
  const canReorder =
    order.status === "delivery" ||
    order.status === "pickup" ||
    order.status === "finished";
  const showDownload = true;

  const handleCancel = async () => {
    setCancelError(null);
    try {
      setLoading(true);
      const res = await fetch("/api/user/orders/cancel", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCancelError(data.message ?? "Nie udało się anulować zamówienia.");
        return;
      }
      router.refresh();
      window.location.reload();
    } catch {
      setCancelError("Wystąpił błąd. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async () => {
    setReorderError(null);
    try {
      setLoading(true);
      const res = await fetch(`/api/user/orders/${order.id}/add-to-cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message =
          data?.message ||
          data?.error ||
          "Nie udało się dodać do koszyka. Spróbuj ponownie.";
        setReorderError(message);
        return;
      }
      await refreshCart();
      setReorderDialogOpen(false);
      toast({
        variant: "success",
        title: "Zamówienie zostało dodane do koszyka",
      });
    } catch (e) {
      console.error(e);
      setReorderError(
        e instanceof Error ? e.message : "Wystąpił błąd. Spróbuj ponownie."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadXlsx = async () => {
    try {
      const res = await fetch("/api/user/orders/download/xlsx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
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
    } catch {}
  };

  const handleDownloadPdf = async () => {
    try {
      const res = await fetch("/api/user/orders/download/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
      });
      if (!res.ok) throw new Error("Błąd pobierania");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Zamówienie-${order.orderNumber}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {}
  };

  const shipping = order as {
    city?: string;
    address?: string;
    zipCode?: string;
  };
  const hasDeliveryAddress =
    shipping.city || shipping.address || shipping.zipCode;

  return (
    <div className="w-full flex flex-col items-center px-12">
      <div className="w-full sm:mt-3 mb-10">
        <div className="hidden sm:flex items-center mb-5 mt-2">
          <GoBackArrow ariaLabel="Wróć do zamówień" />
          <h1 className="text-xl lg:text-3xl font-bold text-panel-title ml-1 mr-3">
            Szczegóły zamówienia
          </h1>
          <StatusBadge status={order.status} />
        </div>
        <div className="sm:hidden flex items-center gap-2 mb-3 mt-3">
          <GoBackArrow ariaLabel="Wróć do zamówień" />
          <h1 className="text-lg font-bold text-panel-title">
            Szczegóły zamówienia
          </h1>
          <StatusBadge status={order.status} />
        </div>

        <Card className="w-full rounded-2xl border border-solid dark:bg-[#1e1e1e] px-2 relative flex flex-col min-h-0">
          <CardContent className="px-3 pb-2 flex flex-col flex-1 min-h-0">
            <div className="pt-5 sm:pt-6 pb-5 border-b border-border space-y-4">
              <div>
                <p className="text-base font-medium text-foreground">
                  Nr {order.orderNumber}
                  {order.orderName ? (
                    <span className="text-muted-foreground font-normal">
                      {" "}
                      · {order.orderName}
                    </span>
                  ) : null}
                </p>
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
                {order.status === "finished" &&
                  (order as { finishedAt?: string }).finishedAt && (
                    <span>
                      <span className="text-muted-foreground">
                        Zakończono:{" "}
                      </span>
                      <span className="text-foreground">
                        {new Date(
                          (order as { finishedAt: string }).finishedAt
                        ).toLocaleString("pl-PL", {
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
                {canCancel && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="h-9">
                        Anuluj zamówienie
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle className="text-red-500">
                          Anulowanie zamówienia
                        </DialogTitle>
                        <DialogDescription className="py-3">
                          Czy na pewno chcesz anulować to zamówienie? Ta akcja
                          jest nieodwracalna.
                        </DialogDescription>
                      </DialogHeader>
                      {cancelError && (
                        <p className="text-sm text-destructive">
                          {cancelError}
                        </p>
                      )}
                      <div className="flex justify-end">
                        {loading ? (
                          <ButtonLoading />
                        ) : (
                          <Button onClick={handleCancel}>Potwierdź</Button>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                {canReorder && (
                  <Dialog
                    open={reorderDialogOpen}
                    onOpenChange={(open) => {
                      setReorderDialogOpen(open);
                      if (!open) setReorderError(null);
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        className="h-9 gap-1.5"
                        disabled={loading}
                      >
                        <RotateCcw className="w-4 h-4" />
                        Zamów ponownie
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Zamów ponownie</DialogTitle>
                        <DialogDescription className="py-3">
                          Produkty z tego zamówienia zostaną dodane do koszyka.
                          Możesz je edytować i złożyć nowe zamówienie.
                        </DialogDescription>
                      </DialogHeader>
                      {reorderError && (
                        <p className="text-sm text-destructive">
                          {reorderError}
                        </p>
                      )}
                      <div className="flex justify-end">
                        {loading ? (
                          <ButtonLoading />
                        ) : (
                          <Button onClick={handleReorder}>
                            Dodaj do koszyka
                          </Button>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                {showDownload && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 gap-1.5"
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
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={handleDownloadPdf}
                      >
                        PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            <div className="w-full flex flex-col gap-4 pt-4 pb-2">
              {order.items.length > 0 ? (
                <OrderDetailTable items={order.items} />
              ) : (
                <p className="text-sm text-muted-foreground py-4">
                  Brak pozycji w zamówieniu.
                </p>
              )}

              {order.deliveryMethod === "pickup" ? null : hasDeliveryAddress ? (
                <div className="rounded-xl border border-border bg-[#f6f6f6] dark:bg-[#282828] overflow-hidden">
                  <div className="px-4 py-3 border-b border-border">
                    <span className="font-semibold text-panel-title text-sm">
                      Adres dostawy
                    </span>
                  </div>
                  <div className="px-4 pb-4 pt-2 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    {shipping.city && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-0.5">
                          Miasto
                        </div>
                        <div className="text-[#444] dark:text-[#c6c6c6]">
                          {shipping.city}
                        </div>
                      </div>
                    )}
                    {shipping.address && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-0.5">
                          Ulica
                        </div>
                        <div className="text-[#444] dark:text-[#c6c6c6]">
                          {shipping.address}
                        </div>
                      </div>
                    )}
                    {shipping.zipCode && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-0.5">
                          Kod pocztowy
                        </div>
                        <div className="text-[#444] dark:text-[#c6c6c6]">
                          {shipping.zipCode}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

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
