"use client";
import { Order } from "@/app/types/order";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Loader2,
  Plus,
} from "lucide-react";
import { useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/app/components/DataTable";
import { FilterPopoverFrame } from "@/app/components/DataTable/FilterPopoverFrame";

type UserIdProps = {
  userId: string;
};

const STATUS_LABELS: Record<Order["status"], string> = {
  unconfirmed: "Niepotwierdzone",
  confirmed: "Potwierdzone",
  inProgress: "W trakcie realizacji",
  delivery: "Wysłane",
  pickup: "Do odbioru",
  finished: "Zakończone",
  cancelled: "Anulowane",
};

const STATUS_DESCRIPTIONS: Record<Order["status"], string> = {
  unconfirmed: "Zamówienie czeka na potwierdzenie przez sklep.",
  confirmed: "Zamówienie zostało potwierdzone przez sklep.",
  inProgress: "Zamówienie jest w trakcie realizacji.",
  delivery: "Zamówienie zostało wysłane – czeka na dostawę.",
  pickup: "Zamówienie jest gotowe do odbioru osobistego w sklepie.",
  finished: "Zamówienie zakończone (odebrane lub dostarczone).",
  cancelled: "Zamówienie zostało anulowane.",
};

export default function Orders({ userId: _userId }: UserIdProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const itemsPerPage = 10;

  const [orders, setOrders] = useState<Order[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<Order["status"] | null>(
    () => (searchParams.get("status") as Order["status"]) || null
  );
  const [selectedDelivery, setSelectedDelivery] = useState<string | null>(
    () => searchParams.get("deliveryMethod") || null
  );
  const [draftStatus, setDraftStatus] = useState<Order["status"] | null>(null);
  const [draftDelivery, setDraftDelivery] = useState<string | null>(null);
  type SortKey =
    | "orderNumber"
    | "orderName"
    | "createdAt"
    | "totalAmount"
    | "status";
  const [sortBy, setSortBy] = useState<SortKey | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const STATUS_ORDER: Order["status"][] = [
    "unconfirmed",
    "confirmed",
    "inProgress",
    "delivery",
    "pickup",
    "finished",
    "cancelled",
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
        aVal = a.orderName ?? "";
        bVal = b.orderName ?? "";
      } else if (sortBy === "createdAt") {
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
      } else if (sortBy === "totalAmount") {
        aVal = typeof a.totalAmount === "number" ? a.totalAmount : 0;
        bVal = typeof b.totalAmount === "number" ? b.totalAmount : 0;
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
    setInputValue(searchParams.get("search") || "");
    setSelectedStatus((searchParams.get("status") as Order["status"]) || null);
    setSelectedDelivery(searchParams.get("deliveryMethod") || null);
  }, [searchParams]);

  const handleFilterOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        setDraftStatus((searchParams.get("status") as Order["status"]) || null);
        setDraftDelivery(searchParams.get("deliveryMethod") || null);
      }
    },
    [searchParams]
  );

  const updateURL = useCallback(
    (updates: {
      page?: number;
      search?: string;
      status?: string | null;
      deliveryMethod?: string | null;
    }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (updates.page != null) params.set("page", String(updates.page));
      if (updates.search !== undefined) {
        if (updates.search) params.set("search", updates.search);
        else params.delete("search");
      }
      if (updates.status !== undefined) {
        if (updates.status) params.set("status", updates.status);
        else params.delete("status");
      }
      if (updates.deliveryMethod !== undefined) {
        if (updates.deliveryMethod)
          params.set("deliveryMethod", updates.deliveryMethod);
        else params.delete("deliveryMethod");
      }
      router.replace(`/zamowienia?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const page = Number(searchParams.get("page")) || 1;
      const search = searchParams.get("search") || "";
      const status = searchParams.get("status") || "";
      const deliveryMethod = searchParams.get("deliveryMethod") || "";
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(itemsPerPage));
      if (search.trim()) params.set("search", search.trim());
      if (status) params.set("status", status);
      if (deliveryMethod) params.set("deliveryMethod", deliveryMethod);
      const res = await fetch(`/api/user/orders?${params.toString()}`);
      if (!res.ok) {
        setOrders([]);
        setTotalCount(0);
        return;
      }
      const data = await res.json();
      setOrders(data.orders ?? []);
      setTotalCount(data.totalCount ?? 0);
    } catch {
      setOrders([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedStatus) count++;
    if (selectedDelivery) count++;
    return count;
  };

  const handleRefresh = () => {
    setInputValue("");
    setSelectedStatus(null);
    setSelectedDelivery(null);
    setSortBy(null);
    setSortOrder("asc");
    updateURL({ page: 1, search: "", status: null, deliveryMethod: null });
  };

  const handlePageChange = (page: number) => {
    updateURL({ page });
  };

  const currentPage = Number(searchParams.get("page")) || 1;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const getPageHref = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    return `/zamowienia?${params.toString()}`;
  };

  const handleSearchSubmit = () => {
    updateURL({ page: 1, search: inputValue });
  };

  const applyFilters = useCallback(() => {
    updateURL({
      page: 1,
      status: draftStatus,
      deliveryMethod: draftDelivery,
    });
  }, [draftStatus, draftDelivery, updateURL]);

  const clearAllFilters = () => {
    setSelectedStatus(null);
    setSelectedDelivery(null);
    setDraftStatus(null);
    setDraftDelivery(null);
    updateURL({ page: 1, status: null, deliveryMethod: null });
  };

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
          onValueChange={(value) =>
            setDraftStatus((value as Order["status"]) || null)
          }
        >
          <SelectTrigger className="h-10 w-full rounded-lg border-input hover:bg-muted/50 focus:ring-2 focus:ring-ring focus:ring-offset-2">
            <SelectValue placeholder="Wybierz status..." />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(STATUS_LABELS) as Order["status"][]).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
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

  const handleRowClick = (path: string) => {
    router.push(path);
  };

  return (
    <div className="w-full flex flex-col items-center px-12">
      <div className="w-full sm:mt-5 mb-10">
        <div className="hidden sm:block mb-5">
          <h1 className="text-xl lg:text-3xl font-bold text-panel-title">
            Zamówienia
          </h1>
        </div>
        <div className="sm:hidden mb-3">
          <h1 className="text-lg font-bold text-panel-title">Zamówienia</h1>
        </div>

        <DataTable
          basePath="/zamowienia"
          searchPlaceholder="Szukaj nr. zamówienia lub zlecenia..."
          searchValue={inputValue}
          onSearchChange={setInputValue}
          onSearchSubmit={handleSearchSubmit}
          onRefresh={handleRefresh}
          loading={loading}
          filterBadgeCount={getActiveFiltersCount()}
          filterPopover={filterPopover}
          onFilterOpenChange={handleFilterOpenChange}
          toolbarRight={
            <Button asChild>
              <Link href="/nowe-zamowienie" className="flex">
                <Plus className="w-4 h-4 md:mr-[2px]" />
                <span className="hidden md:inline">Nowe</span>
              </Link>
            </Button>
          }
          entityNamePlural="zamówień"
          emptyMessage="Brak zamówień"
          pagination={{
            page: currentPage,
            limit: itemsPerPage,
            totalCount,
            totalPages,
            hasNextPage: currentPage < totalPages,
            hasPreviousPage: currentPage > 1,
          }}
          onPageChange={handlePageChange}
          getPageHref={getPageHref}
        >
          <Table
            className={
              orders.length > 0
                ? "border-b-[0.8px] border-solid border-[#ccc] dark:border-[#333]"
                : ""
            }
          >
            <TableHeader>
              <TableRow className="bg-[#f1f1f1] dark:bg-[#2a2a2a] h-14 border-b-0 hover:bg-[#f1f1f1] dark:hover:bg-[#2a2a2a]">
                <TableHead className="font-medium text-[#444] dark:text-[#aaa] rounded-ss-xl text-base tracking-[0] leading-6">
                  <button
                    type="button"
                    onClick={() => handleSort("orderNumber")}
                    className="inline-flex items-center gap-1 cursor-pointer hover:opacity-80"
                  >
                    Nr. zamówienia
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
                    onClick={() => handleSort("createdAt")}
                    className="inline-flex items-center gap-1 cursor-pointer hover:opacity-80"
                  >
                    Data zamówienia
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
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-[150px] text-center rounded-b-2xl text-panel-textEmpty"
                  >
                    Brak zamówień
                  </TableCell>
                </TableRow>
              ) : (
                sortedOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    onClick={() =>
                      handleRowClick(`/zamowienia/zamowienie/${order.id}`)
                    }
                    className="min-h-[76px] border-b-[0.8px] border-solid border-[#ccc] dark:border-[#333] cursor-pointer hover:bg-panel-rowHover dark:hover:bg-panel-rowHover"
                  >
                    <TableCell>
                      <div
                        className="text-[#444] text-base dark:text-[#c6c6c6] font-medium truncate"
                        title={order.orderNumber}
                      >
                        {order.orderNumber}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[220px]">
                      <div className="text-[#444] dark:text-[#c6c6c6] font-normal break-words">
                        {order.orderName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-[#444] dark:text-[#c6c6c6] font-normal truncate">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="text-[#444] dark:text-[#c6c6c6] font-normal">
                        {typeof order.totalAmount === "number"
                          ? `${order.totalAmount.toFixed(2)} zł`
                          : "—"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider delayDuration={150}>
                        {order.status === "unconfirmed" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="bg-gray-100 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400 whitespace-nowrap py-1 px-2 rounded-lg font-medium text-sm inline-block cursor-default">
                                Niepotwierdzone
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[260px]">
                              {STATUS_DESCRIPTIONS.unconfirmed}
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {order.status === "confirmed" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 whitespace-nowrap py-1 px-2 rounded-lg font-medium text-sm inline-block cursor-default">
                                Potwierdzone
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[260px]">
                              {STATUS_DESCRIPTIONS.confirmed}
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {order.status === "inProgress" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 whitespace-nowrap py-1 px-2 rounded-lg font-medium text-sm inline-block cursor-default">
                                W trakcie realizacji
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[260px]">
                              {STATUS_DESCRIPTIONS.inProgress}
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {(order.status === "delivery" ||
                          order.status === "pickup") && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300 whitespace-nowrap py-1 px-2 rounded-lg font-medium text-sm inline-block cursor-default">
                                {order.status === "delivery"
                                  ? "Wysłane"
                                  : "Do odbioru"}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[260px]">
                              {STATUS_DESCRIPTIONS[order.status]}
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {order.status === "finished" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-300 whitespace-nowrap py-1 px-2 rounded-lg font-medium text-sm inline-block cursor-default">
                                Zakończone
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[260px]">
                              {STATUS_DESCRIPTIONS.finished}
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {order.status === "cancelled" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 whitespace-nowrap py-1 px-2 rounded-lg font-medium text-sm inline-block cursor-default">
                                Anulowane
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[260px]">
                              {STATUS_DESCRIPTIONS.cancelled}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </TooltipProvider>
                    </TableCell>
                    <TableCell
                      onClick={(e) => e.stopPropagation()}
                      className="text-center w-[50px]"
                    >
                      <div className="flex justify-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 min-w-0 rounded-md bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                                asChild
                              >
                                <Link
                                  href={`/zamowienia/zamowienie/${order.id}`}
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
      </div>
    </div>
  );
}
