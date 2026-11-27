"use client";

import { getProductDisplayName } from "@/app/dictionary/dictionary";
import type { CartEntry } from "@/app/contexts/CartContext";
import type { ProductConfiguration } from "@/app/contexts/ProductContext";
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
import React, { useState } from "react";
import { Info } from "lucide-react";
import { IndividualQuoteTooltip } from "@/app/components/IndividualQuoteTooltip";
import { getInputConfigById } from "@/app/contexts/inputTypes";
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


export const SUMMARY_SECTIONS = [
  {
    id: "dimensions",
    title: "Wymiary",
    inputIds: ["WIDTH", "HEIGHT"],
  },
  {
    id: "appearance",
    title: "Wariant",
    inputIds: ["COLOR", "MODEL"],
  },
  { id: "note", title: "Uwagi", special: "note" as const },
  { id: "quantity", title: "Ilość", special: "quantity" as const },
  { id: "price", title: "Cena", special: "price" as const },
] as const;

export type SummarySection = (typeof SUMMARY_SECTIONS)[number];

export function getSectionFields(
  section: SummarySection
): { configKey: string; label: string }[] {
  if ("special" in section && section.special) {
    if (section.special === "quantity")
      return [{ configKey: "quantity", label: "Ilość" }];
    if (section.special === "price")
      return [{ configKey: "price", label: "Cena" }];
    if (section.special === "note")
      return [{ configKey: "note", label: "Uwagi" }];
  }
  const inputIds =
    "inputIds" in section && section.inputIds ? section.inputIds : [];
  const fromInputs = inputIds
    .map((id: string) => getInputConfigById(id))
    .filter(Boolean)
    .map((input) => ({ configKey: input!.configKey, label: input!.label }));
  return fromInputs;
}

function formatConfigValue(
  config: ProductConfiguration,
  configKey: string
): React.ReactNode | string[] {
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
    const custom = config.handleValue ?? config.handleCustom ?? "";
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
  config: ProductConfiguration
): boolean {
  const fields = getSectionFields(section);
  return fields.some(({ configKey }) => {
    const raw = config[configKey];
    if (raw == null || raw === "") return false;
    if (Array.isArray(raw) && raw.length === 0) return false;
    if ("special" in section && section.special === "price")
      return config.price != null || config.needsIndividualQuote;
    return true;
  });
}

export interface ProductConfigSummaryTableProps {
  product: CartEntry["products"][number];
}

export function ProductConfigSummaryTable({
  product,
}: ProductConfigSummaryTableProps) {
  const [openNoteIndex, setOpenNoteIndex] = useState<number | null>(null);
  const configs = product.configurations ?? [];
  const productTotal = configs.reduce(
    (sum, c) => sum + (c.price ?? 0) * (c.quantity ?? 1),
    0
  );
  const hasQuote = configs.some((c) => c.needsIndividualQuote);

  const visibleSections = SUMMARY_SECTIONS.filter((section) =>
    configs.some((config) => hasValueInSection(section, config))
  );

  const showTypColumn = configs.some(
    (c) => c.subvariant != null && String(c.subvariant).trim() !== ""
  );

  return (
    <Accordion
      type="single"
      collapsible
      className="rounded-xl border border-border bg-[#fcfcfc] dark:bg-[#232323] overflow-hidden"
    >
      <AccordionItem value="open" className="border-0">
        <AccordionTrigger className="px-4 py-3 bg-[#f4f4f4] dark:bg-[#272727] hover:no-underline border-b border-[#ccc] dark:border-[#555] [&[data-state=open]]:border-b">
          <div className="flex flex-1 min-w-0 items-center justify-between gap-2 text-left">
            <span className="font-semibold text-panel-title text-sm">
              {getProductDisplayName(product.variant)}
            </span>
            <div className="text-sm font-medium text-panel-title shrink-0 mr-2 flex items-center gap-1.5">
              {productTotal !== 0 && formatCurrency(productTotal)}
              {hasQuote && (
                <IndividualQuoteTooltip
                  variant={productTotal === 0 ? "single" : "sum"}
                />
              )}
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
                  {visibleSections.map((section) => (
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
                {configs.map((config, cIdx) => (
                  <TableRow
                    key={cIdx}
                    className="border-[#ccc] dark:border-[#555]"
                  >
                    {showTypColumn && (
                      <TableCell className="align-top text-[#444] dark:text-[#c6c6c6] max-w-[180px]">
                        <div className="text-[15px] font-bold text-panel-title">
                          {config.subvariant}
                        </div>
                      </TableCell>
                    )}
                    {visibleSections.map((section) => {
                      if (section.id === "note") {
                        const note = config.note?.trim() ?? "";
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
                                        onClick={() => setOpenNoteIndex(cIdx)}
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
                      const items = fields
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
                              if (config.needsIndividualQuote)
                                return {
                                  label,
                                  node: (
                                    <IndividualQuoteTooltip
                                      key={configKey}
                                      variant="single"
                                    />
                                  ),
                                };
                              if (config.price != null && config.price !== 0)
                                return {
                                  label,
                                  node: formatCurrency(
                                    config.price * (config.quantity ?? 1)
                                  ),
                                };
                              return null;
                            }
                            const value = formatConfigValue(config, configKey);
                            if (value == null || value === "") return null;
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
                        section.id === "quantity" || section.id === "price";
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
                            {items.map(({ label, node }, i) =>
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
            <Dialog
              open={openNoteIndex !== null}
              onOpenChange={(open) => !open && setOpenNoteIndex(null)}
            >
              <DialogContent className="max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Uwagi</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-panel-title whitespace-pre-wrap">
                  {openNoteIndex != null
                    ? configs[openNoteIndex]?.note?.trim() ?? ""
                    : ""}
                </p>
              </DialogContent>
            </Dialog>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
