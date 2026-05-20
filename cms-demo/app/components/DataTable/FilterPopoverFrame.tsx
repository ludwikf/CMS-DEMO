"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import React, { createContext, useCallback, useContext } from "react";

const FilterPopoverContext = createContext<{ close: () => void } | null>(null);

export function useFilterPopoverClose() {
  const ctx = useContext(FilterPopoverContext);
  return ctx?.close ?? (() => {});
}

interface FilterPopoverFrameProps {
  title?: string;
  children: React.ReactNode;
  onClear: () => void;
  onApply?: () => void;
  hasActiveFilters: boolean;
}

export function FilterPopoverFrame({
  title = "Filtry",
  children,
  onClear,
  onApply,
  hasActiveFilters,
}: FilterPopoverFrameProps) {
  const close = useFilterPopoverClose();

  const handleApply = useCallback(() => {
    onApply?.();
    close();
  }, [onApply, close]);

  const handleClear = useCallback(() => {
    onClear();
    close();
  }, [onClear, close]);

  return (
    <>
      <div className="flex items-center justify-between pb-4">
        <h4 className="text-base font-semibold text-foreground">{title}</h4>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          onClick={close}
          aria-label="Zamknij"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-5">{children}</div>

      <div className="mt-6 flex flex-col gap-2 border-t border-border pt-4">
        <Button
          size="sm"
          className="h-9 w-full rounded-lg font-medium"
          onClick={handleApply}
        >
          Zastosuj
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-full rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-50"
          onClick={handleClear}
          disabled={!hasActiveFilters}
        >
          Wyczyść filtry
        </Button>
      </div>
    </>
  );
}

export { FilterPopoverContext };
