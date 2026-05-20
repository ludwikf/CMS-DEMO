"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronDown, ChevronRight, ChevronUp } from "lucide-react";
import { useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { DataTable } from "@/app/components/DataTable";
import { FilterPopoverFrame } from "@/app/components/DataTable/FilterPopoverFrame";
import { TableErrorBoundary } from "./TableErrorBoundary";
import { OrderStatusDialog } from "./OrderStatusDialog";
import { Order, OrdersTableProps } from "../types";

const BASE_PATH = "/admin/zamowienia";

export default function OrdersTable({
  initialOrders,
  initialPagination,
  currentPage,
  currentLimit,
}: OrdersTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [pagination, setPagination] = useState(initialPagination);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(
    () => searchParams.get("status") || null
  );
  const [selectedDelivery, setSelectedDelivery] = useState<string | null>(
    () => searchParams.get("deliveryMethod") || null
  );
  const [draftStatus, setDraftStatus] = useState<string | null>(null);
  const [draftDelivery, setDraftDelivery] = useState<string | null>(null);
  const [filterLoading, setFilterLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [statusDialogOrderId, setStatusDialogOrderId] = useState<string | null>(
    null
  );
  type SortKey =
    | "orderNumber"
    | "orderName"
    | "client"
    | "createdAt"
    | "totalAmount"
    | "status";
  const [sortBy, setSortBy] = useState<SortKey | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const STATUS_ORDER: string[] = [
    "UNCONFIRMED",
    "PENDING",
    "CONFIRMED",
    "IN_PROGRESS",
    "DELIVERED",
    "FINISHED",
    "CANCELLED",
  ];

  const sortedOrders = useMemo(() => {
    if (!sortBy) return orders;
    const list = [...orders];
    list.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      if (sortBy === "orderNumber") {
        aVal = a.orderNumber;
        bVal = b.orderNumber;
      } else if (sortBy === "orderName") {
        aVal = (a.orderName ?? "") || "";
        bVal = (b.orderName ?? "") || "";
      } else if (sortBy === "client") {
        aVal = a.user?.email ?? "";
        bVal = b.user?.email ?? "";
      } else if (sortBy === "createdAt") {
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
      } else if (sortBy === "totalAmount") {
        aVal = a.totalAmount;
        bVal = b.totalAmount;
      } else {
        const idxA = STATUS_ORDER.indexOf(a.status);
        const idxB = STATUS_ORDER.indexOf(b.status);
        aVal = idxA === -1 ? 999 : idxA;
        bVal = idxB === -1 ? 999 : idxB;
      }
      if (typeof aVal === "string" && typeof bVal === "string") {
        const cmp = aVal.localeCompare(bVal, "pl");
        return sortOrder === "asc" ? cmp : -cmp;
      }
      const cmp =
        (aVal as number) < (bVal as number)
          ? -1
          : (aVal as number) > (bVal as number)
          ? 1
          : 0;
      return sortOrder === "asc" ? cmp : -cmp;
    });
    return list;
  }, [orders, sortBy, sortOrder]);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
  };

  useEffect(() => {
    setOrders(initialOrders);
    setPagination(initialPagination);
    setFilterLoading(false);
    setPageLoading(false);
  }, [initialOrders, initialPagination]);

  useEffect(() => {
    setSelectedStatus(searchParams.get("status") || null);
    setSelectedDelivery(searchParams.get("deliveryMethod") || null);
  }, [searchParams]);

  const updateURL = (updates: Record<string, string | null>) => {
    try {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "all") params.delete(key);
        else params.set(key, String(value));
      });
      params.delete("page");
      router.push(`${BASE_PATH}?${params.toString()}`);
    } catch (error) {
      console.error("Error updating URL:", error);
      setFilterLoading(false);
    }
  };

  const navigateToPage = (page: number) => {
    try {
      if (
        !Number.isInteger(page) ||
        page < 1 ||
        page > pagination.totalPages ||
        page > 10000
      ) {
        return;
      }
      setPageLoading(true);
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", page.toString());
      router.push(`${BASE_PATH}?${params.toString()}`);
    } catch (error) {
      console.error("Error navigating to page:", error);
      setPageLoading(false);
    }
  };

  const handleRefresh = () => {
    setFilterLoading(true);
    setSearchTerm("");
    setSelectedStatus(null);
    setSelectedDelivery(null);
    setSortBy(null);
    setSortOrder("asc");
    router.push(`${BASE_PATH}?page=1&limit=${pagination.limit}`);
    setTimeout(() => setFilterLoading(false), 500);
  };
  const handleSearchSubmit = () => {
    setFilterLoading(true);
    if (searchTerm.length > 0) updateURL({ search: searchTerm });
    else updateURL({ search: null });
  };

  const getPageHref = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    return `${BASE_PATH}?${params.toString()}`;
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedStatus) count++;
    if (selectedDelivery) count++;
    return count;
  };

  const applyFilters = useCallback(() => {
    updateURL({ status: draftStatus, deliveryMethod: draftDelivery });
  }, [draftStatus, draftDelivery]);

  const clearAllFilters = () => {
    setSelectedStatus(null);
    setSelectedDelivery(null);
    setDraftStatus(null);
    setDraftDelivery(null);
    updateURL({ status: null, deliveryMethod: null });
  };

  const handleFilterOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        setDraftStatus(searchParams.get("status") || null);
        setDraftDelivery(searchParams.get("deliveryMethod") || null);
      }
    },
    [searchParams]
  );

  const filterPopover = (
    <FilterPopoverFrame
      title="Filtry"
      hasActiveFilters={getActiveFiltersCount() > 0}
      onClear={clearAllFilters}
      onApply={applyFilters}
    >
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Status</label>
        <Select
          key={draftStatus ?? "empty"}
          value={draftStatus ?? undefined}
          onValueChange={(value) => setDraftStatus(value || null)}
        >
          <SelectTrigger className="h-10 w-full rounded-lg border-input hover:bg-muted/50 focus:ring-2 focus:ring-ring focus:ring-offset-2">
            <SelectValue placeholder="Wybierz status..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="UNCONFIRMED">Niepotwierdzone</SelectItem>
            <SelectItem value="PENDING">Niepotwierdzone (legacy)</SelectItem>
            <SelectItem value="CONFIRMED">Potwierdzone</SelectItem>
            <SelectItem value="IN_PROGRESS">W realizacji</SelectItem>
            <SelectItem value="DELIVERED">Wysłane</SelectItem>
            <SelectItem value="FINISHED">Zakończone</SelectItem>
            <SelectItem value="CANCELLED">Anulowane</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Metoda dostawy
        </label>
        <Select
          key={draftDelivery ?? "empty"}
          value={draftDelivery ?? undefined}
          onValueChange={(value) => setDraftDelivery(value || null)}
        >
          <SelectTrigger className="h-10 w-full rounded-lg border-input hover:bg-muted/50 focus:ring-2 focus:ring-ring focus:ring-offset-2">
            <SelectValue placeholder="Wszystkie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="delivery">Dostawa</SelectItem>
            <SelectItem value="pickup">Odbiór osobisty</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </FilterPopoverFrame>
  );

  return (
    <TableErrorBoundary>
      <DataTable
        basePath={BASE_PATH}
        searchPlaceholder="Szukaj zamówień..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        onSearchSubmit={handleSearchSubmit}
        onRefresh={handleRefresh}
        loading={filterLoading || pageLoading}
        filterBadgeCount={getActiveFiltersCount()}
        filterPopover={filterPopover}
        onFilterOpenChange={handleFilterOpenChange}
        entityNamePlural="zamówień"
        emptyMessage="Brak zamówień"
        pagination={pagination}
        onPageChange={navigateToPage}
        getPageHref={getPageHref}
        onLimitChange={(limit) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("limit", String(limit));
          params.delete("page");
          router.push(`${BASE_PATH}?${params.toString()}`);
        }}
        limitOptions={[5, 10, 20, 50]}
      >
        <Table
          className={`flex-1 ${
            orders.length > 0
              ? "border-b-[0.8px] border-solid border-[#ccc] dark:border-[#333]"
              : ""
          }`}
        >
          <TableHeader>
            <TableRow className="bg-[#f1f1f1] dark:bg-[#2a2a2a] h-14 border-b-0 hover:bg-[#f1f1f1] dark:hover:bg-[#2a2a2a]">
              <TableHead className="font-medium text-[#444] dark:text-[#aaa] rounded-ss-xl text-base tracking-[0] leading-6">
                <button
                  type="button"
                  onClick={() => handleSort("orderNumber")}
                  className="inline-flex items-center gap-1 cursor-pointer hover:opacity-80"
                >
                  Numer zamówienia
                  {sortBy === "orderNumber" &&
                    (sortOrder === "asc" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    ))}
                </button>
              </TableHead>
              <TableHead className="font-medium text-[#444] dark:text-[#aaa] text-base tracking-[0] leading-6">
                <button
                  type="button"
                  onClick={() => handleSort("orderName")}
                  className="inline-flex items-center gap-1 cursor-pointer hover:opacity-80"
                >
                  Zlecenie
                  {sortBy === "orderName" &&
                    (sortOrder === "asc" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    ))}
                </button>
              </TableHead>
              <TableHead className="font-medium text-[#444] dark:text-[#aaa] text-base tracking-[0] leading-6">
                <button
                  type="button"
                  onClick={() => handleSort("client")}
                  className="inline-flex items-center gap-1 cursor-pointer hover:opacity-80"
                >
                  Klient
                  {sortBy === "client" &&
                    (sortOrder === "asc" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    ))}
                </button>
              </TableHead>
              <TableHead className="font-medium text-[#444] dark:text-[#aaa] text-base tracking-[0] leading-6">
                <button
                  type="button"
                  onClick={() => handleSort("createdAt")}
                  className="inline-flex items-center gap-1 cursor-pointer hover:opacity-80"
                >
                  Data utworzenia
                  {sortBy === "createdAt" &&
                    (sortOrder === "asc" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    ))}
                </button>
              </TableHead>
              <TableHead className="font-medium text-[#444] dark:text-[#aaa] text-base tracking-[0] leading-6 text-right">
                <button
                  type="button"
                  onClick={() => handleSort("totalAmount")}
                  className="inline-flex items-center gap-1 cursor-pointer hover:opacity-80 ml-auto"
                >
                  Kwota
                  {sortBy === "totalAmount" &&
                    (sortOrder === "asc" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    ))}
                </button>
              </TableHead>
              <TableHead className="font-medium text-[#444] dark:text-[#aaa] text-base tracking-[0] leading-6 text-right">
                <button
                  type="button"
                  onClick={() => handleSort("status")}
                  className="inline-flex items-center gap-1 cursor-pointer hover:opacity-80 ml-auto"
                >
                  Status
                  {sortBy === "status" &&
                    (sortOrder === "asc" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    ))}
                </button>
              </TableHead>
              <TableHead className="font-medium text-[#444] dark:text-[#aaa] rounded-se-xl text-base tracking-[0] leading-6 text-center w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedOrders.length === 0 ? (
              <TableRow className="border-b-0">
                <TableCell
                  colSpan={7}
                  className="h-[150px] text-center rounded-b-2xl text-gray-500"
                >
                  Brak zamówień
                </TableCell>
              </TableRow>
            ) : (
              sortedOrders.map((order) => (
                <TableRow
                  key={order.id}
                  className="group min-h-[76px] border-b-[0.8px] border-solid border-[#ccc] dark:border-[#333]"
                >
                  <TableCell>
                    <div className="text-[#444] text-base dark:text-[#c6c6c6] font-medium">
                      {order.orderNumber}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[220px]">
                    <div className="text-[#444] dark:text-[#c6c6c6] font-normal break-words">
                      {order.orderName ?? "—"}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[220px]">
                    <div className="text-[#444] dark:text-[#c6c6c6] font-normal break-words">
                      {order.user.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-[#444] dark:text-[#c6c6c6] font-normal">
                      {new Date(order.createdAt).toLocaleDateString("pl-PL")}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="text-[#444] dark:text-[#c6c6c6] font-normal">
                      {order.totalAmount.toFixed(2)} zł
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      type="button"
                      onClick={() => setStatusDialogOrderId(order.id)}
                      className="cursor-pointer"
                    >
                      <Badge
                        className={`rounded-[26843500px] h-[25px] px-3 font-medium text-sm cursor-pointer ${
                          order.status === "FINISHED"
                            ? "bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-300 hover:bg-green-100"
                            : order.status === "CANCELLED"
                            ? "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-100"
                            : order.status === "UNCONFIRMED" ||
                              order.status === "PENDING"
                            ? "bg-gray-100 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400 hover:bg-gray-100"
                            : order.status === "CONFIRMED" ||
                              order.status === "IN_PROGRESS"
                            ? "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-100"
                            : order.status === "DELIVERED"
                            ? "bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300 hover:bg-sky-100"
                            : "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-100"
                        }`}
                      >
                        {order.status === "FINISHED"
                          ? "Zakończone"
                          : order.status === "CANCELLED"
                          ? "Anulowane"
                          : order.status === "UNCONFIRMED" ||
                            order.status === "PENDING"
                          ? "Niepotwierdzone"
                          : order.status === "CONFIRMED"
                          ? "Potwierdzone"
                          : order.status === "IN_PROGRESS"
                          ? "W realizacji"
                          : order.status === "DELIVERED"
                          ? "Wysłane"
                          : "W realizacji"}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell className="text-center w-[50px]">
                    <div className="flex justify-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 min-w-0 rounded-md bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                              asChild
                            >
                              <Link
                                href={`/admin/zamowienia/${order.id}`}
                                rel="noopener noreferrer"
                                aria-label="Szczegóły zamówienia"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Szczegóły</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </DataTable>
      {statusDialogOrderId &&
        (() => {
          const order = orders.find((o) => o.id === statusDialogOrderId);
          if (!order) return null;
          return (
            <OrderStatusDialog
              orderId={order.id}
              prismaStatus={order.status}
              shipping={order.shipping}
              deliveryMethod={
                order.shipping?.method === "pickup" ? "pickup" : "delivery"
              }
              open={true}
              onOpenChange={(open) => !open && setStatusDialogOrderId(null)}
              onSuccess={() => {
                setStatusDialogOrderId(null);
                router.refresh();
              }}
            />
          );
        })()}
    </TableErrorBoundary>
  );
}
