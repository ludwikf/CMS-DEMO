"use client";

import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter, useParams } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { categories, PRODUCT_CATEGORY_KEYS } from "@/lib/productCategories";
import { usePricingTemplates } from "./hooks/use-pricing-templates";
import { PRODUCT_INPUT_TYPES } from "@/app/contexts/inputTypes";


const DEMO_INPUT_IDS = ["WIDTH", "HEIGHT", "COLOR", "MODEL"] as const;

const demoInputConfigs = PRODUCT_INPUT_TYPES.filter((i) =>
  DEMO_INPUT_IDS.includes(i.id as (typeof DEMO_INPUT_IDS)[number])
);

const DEMO_LABELS: Record<string, string> = {
  WIDTH: "Szerokość",
  HEIGHT: "Wysokość",
  COLOR: "Wariant / kolor",
  MODEL: "Model / wersja",
};

const formSchema = z
  .object({
    category: z.enum(PRODUCT_CATEGORY_KEYS, {
      required_error: "Wybierz kategorię",
    }),
    variant: z.string().min(1, { message: "Nazwa jest wymagana" }),
    status: z.enum(["ACTIVE", "INACTIVE", "TEST"], {
      required_error: "Wybierz status",
    }),
    pricingTemplate: z.string().optional(),
  })
  .refine((data) => !(data.status === "ACTIVE" && !data.pricingTemplate), {
    message: "Szablon cenowy jest wymagany dla statusu Aktywny",
    path: ["pricingTemplate"],
  });

type FormValues = z.infer<typeof formSchema>;

type DemoParam = {
  enabled: boolean;
  defaultEnabled: boolean;
  default: string;
  values: string[];
};

function buildDefaultParams(): Record<string, DemoParam> {
  const params: Record<string, DemoParam> = {};
  for (const id of DEMO_INPUT_IDS) {
    const config = PRODUCT_INPUT_TYPES.find((i) => i.id === id);
    params[id] = {
      enabled: !!config?.enabledByDefault,
      defaultEnabled: false,
      default: "",
      values:
        id === "COLOR"
          ? ["Standard", "Premium"]
          : id === "MODEL"
          ? ["Podstawowy"]
          : [],
    };
  }
  return params;
}

function paramsFromProductInputs(
  inputs: Array<{
    type: string;
    default?: unknown;
    values?: unknown[];
  }>
): Record<string, DemoParam> {
  const base = buildDefaultParams();
  for (const inp of inputs) {
    if (!DEMO_INPUT_IDS.includes(inp.type as (typeof DEMO_INPUT_IDS)[number]))
      continue;
    base[inp.type] = {
      enabled: true,
      defaultEnabled: inp.default != null && inp.default !== "",
      default: inp.default != null ? String(inp.default) : "",
      values: Array.isArray(inp.values)
        ? inp.values.map((v) => String(v))
        : base[inp.type].values,
    };
  }
  return base;
}

function toApiInputs(params: Record<string, DemoParam>) {
  return DEMO_INPUT_IDS.filter((id) => params[id]?.enabled).map((id) => {
    const p = params[id];
    const config = PRODUCT_INPUT_TYPES.find((i) => i.id === id);
    const entry: {
      type: string;
      default?: number | string | null;
      values?: string[];
      required?: boolean;
    } = {
      type: id,
      required: config?.hasRequired ?? false,
    };
    if (p.defaultEnabled && p.default !== "") {
      entry.default =
        config?.type === "number" ? parseFloat(p.default) || null : p.default;
    }
    if (config?.hasValues && p.values.length > 0) {
      entry.values = p.values;
    }
    return entry;
  });
}

interface ProductFormProps {
  initialProduct?: {
    category: FormValues["category"];
    variant: string;
    status: FormValues["status"];
    pricingTemplate?: { id: string };
    inputsBySubvariant?: Record<
      string,
      Array<{ type: string; default?: unknown; values?: unknown[] }>
    >;
    inputs?: Record<
      string,
      Array<{ type: string; default?: unknown; values?: unknown[] }>
    >;
  } | null;
}

export default function ProductForm({ initialProduct }: ProductFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const action = params.action as string;
  const isAddMode = action === "nowy-produkt";

  const { pricingTemplates, isLoadingTemplates } = usePricingTemplates();
  const [demoParams, setDemoParams] = useState(buildDefaultParams);
  const [newValueById, setNewValueById] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ready, setReady] = useState(isAddMode);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: undefined,
      variant: "",
      status: "INACTIVE",
      pricingTemplate: "",
    },
  });

  useEffect(() => {
    if (!initialProduct || isAddMode) {
      setReady(true);
      return;
    }
    form.reset({
      category: initialProduct.category,
      variant: initialProduct.variant,
      status: initialProduct.status,
      pricingTemplate: initialProduct.pricingTemplate?.id ?? "",
    });
    const mainInputs =
      initialProduct.inputsBySubvariant?.main ??
      initialProduct.inputs?.main ??
      [];
    setDemoParams(paramsFromProductInputs(mainInputs));
    setReady(true);
  }, [initialProduct, isAddMode, form]);

  const updateParam = (id: string, patch: Partial<DemoParam>) => {
    setDemoParams((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
  };

  const addValue = (id: string) => {
    const value = (newValueById[id] ?? "").trim();
    if (!value) return;
    if (demoParams[id].values.includes(value)) return;
    updateParam(id, { values: [...demoParams[id].values, value] });
    setNewValueById((prev) => ({ ...prev, [id]: "" }));
  };

  const removeValue = (id: string, value: string) => {
    updateParam(id, {
      values: demoParams[id].values.filter((v) => v !== value),
    });
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const productData = {
        category: values.category,
        variant: values.variant,
        status: values.status,
        pricingTemplateId: values.pricingTemplate || undefined,
        inputsBySubvariant: { main: toApiInputs(demoParams) },
        subvariants: [] as string[],
      };

      const url = isAddMode
        ? "/api/admin/products"
        : `/api/admin/products/${action}`;
      const response = await fetch(url, {
        method: isAddMode ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const error = await response.json();
        if (
          error.error?.includes("already exists") ||
          error.error?.includes("istnieje")
        ) {
          form.setError("variant", {
            type: "manual",
            message: "Produkt o tej nazwie już istnieje w tej kategorii",
          });
          return;
        }
        toast({
          variant: "destructive",
          title: "Błąd",
          description:
            error.message || error.error || "Nie udało się zapisać produktu",
        });
        return;
      }

      toast({
        title: isAddMode ? "Produkt dodany" : "Produkt zaktualizowany",
        variant: "success",
      });
      router.push("/admin/produkty");
      router.refresh();
    } catch {
      toast({
        variant: "destructive",
        title: "Błąd",
        description: "Coś poszło nie tak",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-3 sm:pl-[5px] w-full min-w-0">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
        >
          <Card className="shadow-sm dark:bg-[#1e1e1e] dark:border-[#333]">
            <CardContent className="p-4 sm:p-6 space-y-4">
              <h2 className="text-lg font-semibold">Dane produktu</h2>

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz kategorię" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.key} value={c.key}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="variant"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nazwa produktu</FormLabel>
                    <FormControl>
                      <Input placeholder="np. Model X" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Aktywny</SelectItem>
                          <SelectItem value="INACTIVE">Nieaktywny</SelectItem>
                          <SelectItem value="TEST">Test</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pricingTemplate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Szablon cenowy</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Opcjonalnie" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingTemplates ? (
                            <SelectItem value="loading" disabled>
                              Ładowanie…
                            </SelectItem>
                          ) : (
                            pricingTemplates.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm dark:bg-[#1e1e1e] dark:border-[#333]">
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Parametry (demo)</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Pola dostępne przy składaniu zamówienia.
                </p>
              </div>

              {demoInputConfigs.map((config) => {
                const p = demoParams[config.id];
                const isNumber = config.type === "number";
                const hasOptions = config.hasValues;

                return (
                  <div
                    key={config.id}
                    className="rounded-lg border p-3 space-y-3 dark:border-[#333]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm">
                        {DEMO_LABELS[config.id]}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Włącz
                        </span>
                        <Switch
                          checked={p.enabled}
                          onCheckedChange={(checked) =>
                            updateParam(config.id, { enabled: checked })
                          }
                        />
                      </div>
                    </div>

                    {p.enabled && (
                      <>
                        {isNumber && (
                          <div className="flex items-center gap-3 w-full">
                            <Switch
                              checked={p.defaultEnabled}
                              onCheckedChange={(checked) =>
                                updateParam(config.id, {
                                  defaultEnabled: checked,
                                })
                              }
                            />
                            <Input
                              type="number"
                              placeholder="Domyślnie (mm)"
                              disabled={!p.defaultEnabled}
                              value={p.default}
                              onChange={(e) =>
                                updateParam(config.id, {
                                  default: e.target.value,
                                })
                              }
                              className="flex-1"
                            />
                          </div>
                        )}

                        {hasOptions && (
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-1">
                              {p.values.map((v) => (
                                <span
                                  key={v}
                                  className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs"
                                >
                                  {v}
                                  <button
                                    type="button"
                                    onClick={() => removeValue(config.id, v)}
                                    className="text-muted-foreground hover:text-foreground"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Nowa opcja"
                                value={newValueById[config.id] ?? ""}
                                onChange={(e) =>
                                  setNewValueById((prev) => ({
                                    ...prev,
                                    [config.id]: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    addValue(config.id);
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => addValue(config.id)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/produkty")}
            >
              Anuluj
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isAddMode ? "Dodaj produkt" : "Zapisz zmiany"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
