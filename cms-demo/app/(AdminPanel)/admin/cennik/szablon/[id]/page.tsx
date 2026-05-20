"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  createDefaultSubTemplate,
  createDefaultTemplate,
  getMainSubTemplate,
  type DemoPricingInput,
  type DemoSubTemplate,
} from "@/lib/demoPricingTemplate";

const formSchema = z.object({
  name: z
    .string()
    .min(1, "Nazwa jest wymagana")
    .regex(/^#/, "Nazwa musi zaczynać się od #"),
});

type FormValues = z.infer<typeof formSchema>;

export default function DemoPricingTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isAddMode = id === "nowy";
  const { toast } = useToast();

  const [loading, setLoading] = useState(!isAddMode);
  const [saving, setSaving] = useState(false);
  const [subTemplate, setSubTemplate] = useState<DemoSubTemplate>(
    createDefaultSubTemplate
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (isAddMode) return;
    (async () => {
      try {
        const res = await fetch(`/api/admin/pricing-templates/${id}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        form.reset({ name: data.name ?? "" });
        setSubTemplate(
          getMainSubTemplate(data.template as Record<string, unknown>)
        );
      } catch {
        toast({
          variant: "destructive",
          title: "Błąd",
          description: "Nie udało się wczytać szablonu",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isAddMode, form, toast]);

  const table = subTemplate.TABLES[0];

  const updateCell = (hIdx: number, wIdx: number, value: string) => {
    const num = parseFloat(value);
    setSubTemplate((prev) => {
      const next = structuredClone(prev);
      const prices = next.TABLES[0].prices.map((row) => [...row]);
      prices[hIdx][wIdx] = Number.isNaN(num) ? 0 : num;
      next.TABLES[0].prices = prices;
      return next;
    });
  };

  const updateAddon = (
    type: "COLOR" | "MODEL",
    valueIdx: number,
    field: "value" | "price",
    raw: string
  ) => {
    setSubTemplate((prev) => {
      const next = structuredClone(prev);
      const input = next.INPUTS.find((i) => i.type === type);
      if (!input?.values[valueIdx]) return prev;
      if (field === "value") {
        input.values[valueIdx].value = raw;
      } else {
        const n = parseFloat(raw);
        input.values[valueIdx].price = Number.isNaN(n) ? 0 : n;
      }
      return next;
    });
  };

  const addAddonRow = (type: "COLOR" | "MODEL") => {
    setSubTemplate((prev) => {
      const next = structuredClone(prev);
      let input = next.INPUTS.find((i) => i.type === type);
      if (!input) {
        input = { type, values: [] };
        next.INPUTS.push(input);
      }
      input.values.push({ value: "Nowa opcja", price: 0 });
      return next;
    });
  };

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const template = createDefaultTemplate();
      template.main = subTemplate;
      const url = isAddMode
        ? "/api/admin/pricing-templates"
        : `/api/admin/pricing-templates/${id}`;
      const res = await fetch(url, {
        method: isAddMode ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: values.name, template }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Zapis nie powiódł się");
      }
      toast({
        title: isAddMode ? "Szablon utworzony" : "Szablon zapisany",
        variant: "success",
      });
      router.push("/admin/cennik");
      router.refresh();
    } catch (e: unknown) {
      toast({
        variant: "destructive",
        title: "Błąd",
        description: e instanceof Error ? e.message : "Zapis nie powiódł się",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-4 w-full min-w-0 space-y-4">
      <h1 className="text-xl font-semibold">
        {isAddMode ? "Nowy szablon cenowy" : "Edycja szablonu cenowego"}
      </h1>
      <p className="text-sm text-muted-foreground">
        Tabela wymiarów (m) oraz dopłaty za wariant i model.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nazwa (np. #Standard)</FormLabel>
                    <FormControl>
                      <Input placeholder="#Demo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3 overflow-x-auto">
              <h2 className="font-medium">Cena bazowa (zł)</h2>
              <table className="border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="p-1 border" />
                    {table.widths.map((w) => (
                      <th key={w} className="p-1 border min-w-[70px]">
                        {w} m
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.heights.map((h, hIdx) => (
                    <tr key={h}>
                      <td className="p-1 border font-medium">{h} m</td>
                      {table.widths.map((_, wIdx) => (
                        <td key={wIdx} className="p-1 border">
                          <Input
                            type="number"
                            className="h-8 w-20"
                            value={table.prices[hIdx]?.[wIdx] ?? 0}
                            onChange={(e) =>
                              updateCell(hIdx, wIdx, e.target.value)
                            }
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {(["COLOR", "MODEL"] as const).map((type) => {
            const label = type === "COLOR" ? "Wariant / kolor" : "Model";
            const input =
              subTemplate.INPUTS.find((i) => i.type === type) ??
              ({ type, values: [] } as DemoPricingInput);
            return (
              <Card key={type}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <h2 className="font-medium">Dopłata: {label}</h2>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addAddonRow(type)}
                    >
                      + opcja
                    </Button>
                  </div>
                  {input.values.map((row, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        placeholder="Nazwa"
                        value={row.value}
                        onChange={(e) =>
                          updateAddon(type, idx, "value", e.target.value)
                        }
                      />
                      <Input
                        type="number"
                        placeholder="zł"
                        className="w-28"
                        value={row.price}
                        onChange={(e) =>
                          updateAddon(type, idx, "price", e.target.value)
                        }
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/cennik")}
            >
              Anuluj
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Zapisz
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
