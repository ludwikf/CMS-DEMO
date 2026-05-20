"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { Filter, Loader2, RotateCcw } from "lucide-react";
import React, { useState } from "react";
import { FilterPopoverContext } from "./FilterPopoverFrame";

export interface DataTablePagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface DataTableProps {

  basePath: string;

  searchPlaceholder: string;

  searchValue: string;

  onSearchChange: (value: string) => void;

  onSearchSubmit: () => void;

  onRefresh: () => void;

  loading?: boolean;

  filterBadgeCount?: number;

  filterPopover?: React.ReactNode;

  onFilterOpenChange?: (open: boolean) => void;

  toolbarRight?: React.ReactNode;

  emptyMessage?: string;

  entityNamePlural?: string;

  pagination: DataTablePagination;

  onPageChange: (page: number) => void;

  getPageHref?: (page: number) => string;

  onLimitChange?: (limit: number) => void;

  limitOptions?: number[];

  children: React.ReactNode;
}

const SearchIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

export function DataTable({
  basePath,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  onRefresh,
  loading = false,
  filterBadgeCount = 0,
  filterPopover,
  onFilterOpenChange,
  toolbarRight,
  emptyMessage = "Brak danych",
  entityNamePlural = "elementów",
  pagination,
  onPageChange,
  getPageHref,
  onLimitChange,
  limitOptions = [5, 10, 20, 50],
  children,
}: DataTableProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const hrefFor = (page: number) =>
    getPageHref ? getPageHref(page) : `${basePath}?page=${page}`;

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSearchSubmit();
    }
  };

  return (
    <Card className="w-full rounded-2xl border border-solid dark:bg-[#1e1e1e] px-2 relative flex flex-col h-full min-h-0">
      <CardContent className="px-3 pb-2 flex flex-col flex-1 min-h-0">

        <div className="pt-5 sm:pt-6 pb-3 border-solid rounded-b-md shadow-sm sticky top-0 z-20 rounded-t-2xl flex-shrink-0 bg-inherit">
          <div className="flex gap-3 h-10 items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRefresh}
                    disabled={loading}
                    className="h-10 w-10 shrink-0 p-0"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin w-4 h-4" />
                    ) : (
                      <RotateCcw className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Odśwież</TooltipContent>
              </Tooltip>
            </TooltipProvider>


            <div className="sm:hidden">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 w-10 p-0 shrink-0"
                      onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                    >
                      <SearchIcon />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Szukaj</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>


            <div className="relative flex-1 hidden sm:block max-w-md">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <SearchIcon />
              </span>
              <Input
                placeholder={searchPlaceholder}
                className="h-10 pl-10 pr-4"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
            </div>

            <div className="flex items-center gap-3 ml-auto shrink-0">
              {filterPopover != null && (
                <Popover
                  open={filterOpen}
                  onOpenChange={(open) => {
                    setFilterOpen(open);
                    onFilterOpenChange?.(open);
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-10 px-3 gap-2 text-muted-foreground hover:text-foreground relative rounded-lg transition-colors ${
                        filterBadgeCount != null && filterBadgeCount > 0
                          ? "bg-primary/10 hover:bg-primary/15 ring-1 ring-primary/30 dark:bg-primary/20 dark:ring-primary/40"
                          : ""
                      }`}
                    >
                      <Filter className="w-4 h-4 shrink-0" />
                      {filterBadgeCount != null && filterBadgeCount > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs font-medium rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1.5 leading-none">
                          {filterBadgeCount}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-72 border border-border bg-popover text-popover-foreground dark:bg-[#262626] dark:text-gray-100 shadow-lg sm:w-80 p-6 rounded-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200"
                    align="start"
                    sideOffset={8}
                  >
                    <FilterPopoverContext.Provider
                      value={{ close: () => setFilterOpen(false) }}
                    >
                      {filterPopover}
                    </FilterPopoverContext.Provider>
                  </PopoverContent>
                </Popover>
              )}
              {toolbarRight != null && toolbarRight}
            </div>
          </div>
        </div>


        {mobileSearchOpen && (
          <div className="sm:hidden px-0 py-2">
            <div className="relative w-full">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <SearchIcon />
              </span>
              <Input
                placeholder={searchPlaceholder}
                className="h-10 pl-10 pr-4 w-full"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onSearchSubmit();
                    setMobileSearchOpen(false);
                  }
                }}
                autoFocus
              />
            </div>
          </div>
        )}


        {loading && (
          <div className="absolute inset-0 bg-white/70 dark:bg-black/50 flex items-center justify-center z-20 rounded-2xl">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        )}


        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col [&_thead_th]:py-4 [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-muted/50">
          {children}
        </div>


        <div className="flex justify-between whitespace-nowrap mt-2 items-center text-xs text-gray-500 dark:text-gray-400 px-4 py-2">
          <span className="hidden xl:block">
            Wyświetlane{" "}
            {pagination.totalCount === 0
              ? "0"
              : (pagination.page - 1) * pagination.limit + 1}
            -
            {Math.min(
              pagination.page * pagination.limit,
              pagination.totalCount
            )}{" "}
            z {pagination.totalCount} {entityNamePlural}
          </span>

          {pagination.totalPages > 1 && (
            <>
              <Pagination className="sm:hidden">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationLink
                      href={hrefFor(pagination.page - 1)}
                      onClick={(e) => {
                        e.preventDefault();
                        if (pagination.hasPreviousPage) {
                          onPageChange(pagination.page - 1);
                        }
                      }}
                      className={
                        !pagination.hasPreviousPage
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    >
                      {"<"}
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <span className="px-3 py-2 text-sm">
                      {pagination.page} / {pagination.totalPages}
                    </span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink
                      href={hrefFor(pagination.page + 1)}
                      onClick={(e) => {
                        e.preventDefault();
                        if (pagination.hasNextPage) {
                          onPageChange(pagination.page + 1);
                        }
                      }}
                      className={
                        !pagination.hasNextPage
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    >
                      {">"}
                    </PaginationLink>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>

              <Pagination className="hidden sm:flex">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationLink
                      href={hrefFor(pagination.page - 1)}
                      onClick={(e) => {
                        e.preventDefault();
                        if (pagination.hasPreviousPage)
                          onPageChange(pagination.page - 1);
                      }}
                      className={
                        !pagination.hasPreviousPage
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    >
                      {"<"}
                    </PaginationLink>
                  </PaginationItem>
                  {pagination.page > 2 && (
                    <PaginationItem>
                      <PaginationLink
                        href={hrefFor(1)}
                        onClick={(e) => {
                          e.preventDefault();
                          onPageChange(1);
                        }}
                        className="cursor-pointer"
                      >
                        1
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  {pagination.page > 3 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  {pagination.page > 1 && (
                    <PaginationItem>
                      <PaginationLink
                        href={hrefFor(pagination.page - 1)}
                        onClick={(e) => {
                          e.preventDefault();
                          onPageChange(pagination.page - 1);
                        }}
                        className="cursor-pointer"
                      >
                        {pagination.page - 1}
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <PaginationLink href={hrefFor(pagination.page)} isActive>
                      {pagination.page}
                    </PaginationLink>
                  </PaginationItem>
                  {pagination.page < pagination.totalPages && (
                    <PaginationItem>
                      <PaginationLink
                        href={hrefFor(pagination.page + 1)}
                        onClick={(e) => {
                          e.preventDefault();
                          onPageChange(pagination.page + 1);
                        }}
                        className="cursor-pointer"
                      >
                        {pagination.page + 1}
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  {pagination.page < pagination.totalPages - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  {pagination.page < pagination.totalPages - 1 && (
                    <PaginationItem>
                      <PaginationLink
                        href={hrefFor(pagination.totalPages)}
                        onClick={(e) => {
                          e.preventDefault();
                          onPageChange(pagination.totalPages);
                        }}
                        className="cursor-pointer"
                      >
                        {pagination.totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <PaginationLink
                      href={hrefFor(pagination.page + 1)}
                      onClick={(e) => {
                        e.preventDefault();
                        if (pagination.hasNextPage)
                          onPageChange(pagination.page + 1);
                      }}
                      className={
                        !pagination.hasNextPage
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    >
                      {">"}
                    </PaginationLink>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </>
          )}

          {onLimitChange != null && (
            <div className="xl:flex hidden items-center gap-2">
              <span>Na stronę:</span>
              <Select
                value={String(pagination.limit)}
                onValueChange={(v) => onLimitChange(Number(v))}
              >
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {limitOptions.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
