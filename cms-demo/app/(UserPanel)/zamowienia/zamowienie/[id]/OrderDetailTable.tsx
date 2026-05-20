"use client";

import { getProductDisplayName } from "@/app/dictionary/dictionary";
import type { OrderItemType } from "@/app/types/order";
import {
  SUMMARY_SECTIONS,
  getSectionFields,
  type SummarySection,
} from "@/app/(UserPanel)/koszyk/podsumowanie/ProductConfigSummaryTable";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import React, { useState } from "react";
import { Info } from "lucide-react";

type OrderConfigRecord = OrderItemType;

function formatConfigValue(
  config: OrderConfigRecord,
  configKey: string
): React.ReactNode | string[] | null {
  const raw = config[configKey];
  if (raw == null || raw === "") return null;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw
      .map((a: { name?: string; quantity?: number }) =>
        a.name && a.quantity != null
          ? `${a.name} × ${a.quantity}`
          : a.name || ""
      )
      .filter(Boolean) as string[];
  }
  if (configKey === "handle" && String(raw).trim().toLowerCase() === "własne") {
    const custom =
      (config as Record<string, unknown>).handleValue ??
      (config as Record<string, unknown>).handleCustom ??
      "";
    return custom ? String(custom).trim() : null;
  }
  const str = String(raw);
  return str.replace(/:(?=\S)/g, ": ");
}

function formatCurrency(value: number) {
  return value.toLocaleString("pl-PL", { style: "currency", currency: "PLN" });
}

function hasValueInSection(
  section: SummarySection,
  config: OrderConfigRecord
): boolean {
  const fields = getSectionFields(section);
  return fields.some(({ configKey }) => {
    const raw = config[configKey];
    if (raw == null || raw === "") return false;
    if (Array.isArray(raw) && raw.length === 0) return false;
    if ("special" in section && section.special === "price")
      return config.price != null;
    return true;
  });
}

export function OrderDetailTable({ items }: { items: OrderItemType[] }) {
  const [openNoteIndex, setOpenNoteIndex] = useState<number | null>(null);
  const [openNoteProductKey, setOpenNoteProductKey] = useState<string | null>(
    null
  );

  const grouped = items.reduce((acc, item) => {
    const key = item.product;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, OrderItemType[]>);

  return (
    <div className="w-full flex flex-col gap-4">
      {Object.entries(grouped).map(([productKey, configs]) => {
        const productTotal = configs.reduce(
          (sum, c) => sum + (c.price ?? 0),
          0
        );
        const visibleSections = SUMMARY_SECTIONS.filter((section: SummarySection) =>
          configs.some((config: OrderConfigRecord) => hasValueInSection(section, config))
        );
        const showTypColumn = configs.some(
          (c: OrderConfigRecord) => c.type != null && String(c.type).trim() !== ""
        );

        return (
          <Accordion
            key={productKey}
            type="single"
            collapsible
            defaultValue="open"
            className="rounded-xl border border-border bg-[#fcfcfc] dark:bg-[#232323] overflow-hidden"
          >
            <AccordionItem value="open" className="border-0">
              <AccordionTrigger className="px-4 py-3 bg-[#f4f4f4] dark:bg-[#272727] hover:no-underline border-b border-[#ccc] dark:border-[#555] [&[data-state=open]]:border-b">
                <div className="flex flex-1 min-w-0 items-center justify-between gap-2 text-left">
                  <span className="font-semibold text-panel-title text-sm">
                    {getProductDisplayName(productKey)}
                  </span>
                  <div className="text-sm font-medium text-panel-title shrink-0 mr-2">
                    {productTotal !== 0 && formatCurrency(productTotal)}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="px-4 pt-2 pb-4">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#ccc] dark:border-[#555]">
                        {showTypColumn && (
                          <TableHead className="text-muted-foreground font-semibold max-w-[180px]">
                            Typ
                          </TableHead>
                        )}
                        {visibleSections.map((section: SummarySection) => (
                          <TableHead
                            key={section.id}
                            className={`text-muted-foreground font-semibold ${
                              section.id === "note"
                                ? "text-right w-[72px] min-w-[72px]"
                                : section.id === "quantity"
                                ? "text-right w-[72px] min-w-[72px]"
                                : section.id === "price"
                                ? "text-right w-[100px] min-w-[100px]"
                                : ""
                            }`}
                          >
                            {section.title}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {configs.map((config: OrderConfigRecord, cIdx: number) => (
                        <TableRow
                          key={config.id ?? cIdx}
                          className="border-[#ccc] dark:border-[#555]"
                        >
                          {showTypColumn && (
                            <TableCell className="align-top text-[#444] dark:text-[#c6c6c6] max-w-[180px]">
                              <div className="text-[15px] font-bold text-panel-title">
                                {config.type ?? "—"}
                              </div>
                            </TableCell>
                          )}
                          {visibleSections.map((section: SummarySection) => {
                            if (section.id === "note") {
                              const note =
                                (config.note as string)?.trim() ?? "";
                              return (
                                <TableCell
                                  key={section.id}
                                  className="align-top text-sm text-[#444] dark:text-[#c6c6c6] text-right w-[72px] min-w-[72px]"
                                >
                                  <div className="flex justify-end">
                                    {note && (
                                      <TooltipProvider delayDuration={200}>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <button
                                              type="button"
                                              className="inline-flex items-center justify-center p-1 text-muted-foreground hover:text-foreground cursor-pointer rounded hover:bg-muted/50 transition-colors"
                                              onClick={() => {
                                                setOpenNoteProductKey(
                                                  productKey
                                                );
                                                setOpenNoteIndex(cIdx);
                                              }}
                                              aria-label="Pokaż uwagi"
                                            >
                                              <Info className="h-[18px] w-[18px]" />
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent
                                            side="left"
                                            className="max-w-[500px] whitespace-pre-wrap"
                                          >
                                            {note}
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </div>
                                </TableCell>
                              );
                            }
                            const fields = getSectionFields(section);
                            const fieldItems = fields
                              .map(
                                ({
                                  configKey,
                                  label,
                                }): {
                                  label: string;
                                  node: React.ReactNode;
                                } | null => {
                                  if (
                                    "special" in section &&
                                    section.special === "price"
                                  ) {
                                    if (
                                      config.price != null &&
                                      config.price !== 0
                                    )
                                      return {
                                        label,
                                        node: formatCurrency(config.price),
                                      };
                                    return null;
                                  }
                                  const value = formatConfigValue(
                                    config,
                                    configKey
                                  );
                                  if (
                                    value == null ||
                                    value === "" ||
                                    (Array.isArray(value) && value.length === 0)
                                  )
                                    return null;
                                  return { label, node: value };
                                }
                              )
                              .filter(
                                (
                                  x
                                ): x is {
                                  label: string;
                                  node: React.ReactNode | string[];
                                } => x != null
                              );
                            const alignRight =
                              section.id === "quantity" ||
                              section.id === "price";
                            const hideLabel = alignRight;
                            const cellWidth =
                              section.id === "quantity"
                                ? "w-[72px] min-w-[72px]"
                                : section.id === "price"
                                ? "w-[100px] min-w-[100px]"
                                : "";
                            return (
                              <TableCell
                                key={section.id}
                                className={`align-top text-sm text-[#444] dark:text-[#c6c6c6] ${
                                  alignRight ? "text-right " : ""
                                }${cellWidth}`}
                              >
                                <div
                                  className={`flex flex-col gap-1 ${
                                    alignRight ? "items-end" : ""
                                  }`}
                                >
                                  {fieldItems.map(({ label, node }, i) =>
                                    hideLabel ? (
                                      <div
                                        key={i}
                                        className="text-sm font-[500] text-panel-title"
                                      >
                                        {node}
                                      </div>
                                    ) : Array.isArray(node) ? (
                                      <div
                                        key={i}
                                        className="flex gap-1.5 items-start"
                                      >
                                        <span className="text-xs text-muted-foreground shrink-0 pt-0.5 opacity-70 dark:opacity-40">
                                          {label === "Rączka"
                                            ? "Rączka (cm):"
                                            : `${label}:`}
                                        </span>
                                        <div className="flex flex-col gap-0.5 min-w-0">
                                          {node.map((line, j) => (
                                            <span
                                              key={j}
                                              className="text-sm font-[500] text-panel-title"
                                            >
                                              {line}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    ) : (
                                      <div
                                        key={i}
                                        className="flex items-baseline gap-1.5"
                                      >
                                        <span className="text-xs text-muted-foreground shrink-0 opacity-70 dark:opacity-40">
                                          {label === "Rączka"
                                            ? "Rączka (cm):"
                                            : `${label}:`}
                                        </span>
                                        <span className="text-sm font-[500] text-panel-title">
                                          {node}
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        );
      })}
      <Dialog
        open={openNoteIndex !== null && openNoteProductKey !== null}
        onOpenChange={(open) => {
          if (!open) {
            setOpenNoteIndex(null);
            setOpenNoteProductKey(null);
          }
        }}
      >
        <DialogContent className="max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Uwagi</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-panel-title whitespace-pre-wrap">
            {openNoteProductKey != null && openNoteIndex != null
              ? (
                  grouped[openNoteProductKey]?.[openNoteIndex]?.note as string
                )?.trim() ?? ""
              : ""}
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
