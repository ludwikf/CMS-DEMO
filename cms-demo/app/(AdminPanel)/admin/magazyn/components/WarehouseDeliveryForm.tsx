"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import type { WarehouseIntakePayload } from "@/lib/warehouse-schema";

const QRCodeSVG = dynamic(
  () => import("qrcode.react").then((mod) => mod.QRCodeSVG),
  { ssr: false }
);

type Row = { name: string; quantity: string; unit: string };

const emptyRow = (): Row => ({ name: "", quantity: "", unit: "szt" });

export default function WarehouseDeliveryForm() {
  const [label, setLabel] = useState("");
  const [rows, setRows] = useState<Row[]>([
    { name: "Wkręty", quantity: "50", unit: "szt" },
    { name: "Panele", quantity: "10", unit: "szt" },
  ]);
  const [payload, setPayload] = useState<WarehouseIntakePayload | null>(null);

  const updateRow = (index: number, field: keyof Row, value: string) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);
  const removeRow = (index: number) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));

  const generateQr = () => {
    const items = rows
      .map((row) => ({
        name: row.name.trim(),
        quantity: parseInt(row.quantity, 10),
        unit: row.unit.trim() || "szt",
      }))
      .filter((item) => item.name && item.quantity > 0);

    if (items.length === 0) {
      alert("Dodaj co najmniej jedną pozycję z nazwą i ilością.");
      return;
    }

    const nextPayload: WarehouseIntakePayload = {
      v: 1,
      intakeId: crypto.randomUUID(),
      label: label.trim() || undefined,
      items,
    };
    setPayload(nextPayload);
  };

  const qrValue = payload ? JSON.stringify(payload) : "";

  return (
    <div className="grid gap-6 lg:grid-cols-2 w-full">
      <div className="space-y-4 min-w-0">
        <h2 className="text-lg font-semibold">Nowa dostawa (QR)</h2>
        <div className="space-y-2">
          <Label htmlFor="delivery-label">Etykieta dostawy</Label>
          <Input
            id="delivery-label"
            placeholder="np. Dostawa 20.05.2026"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>
        <div className="space-y-3">
          {rows.map((row, index) => (
            <div key={index} className="grid grid-cols-[1fr_80px_70px_40px] gap-2 items-end">
              <div>
                {index === 0 && (
                  <Label className="text-xs text-muted-foreground">Nazwa</Label>
                )}
                <Input
                  placeholder="Wkręty"
                  value={row.name}
                  onChange={(e) => updateRow(index, "name", e.target.value)}
                />
              </div>
              <div>
                {index === 0 && (
                  <Label className="text-xs text-muted-foreground">Ilość</Label>
                )}
                <Input
                  type="number"
                  min={1}
                  placeholder="50"
                  value={row.quantity}
                  onChange={(e) => updateRow(index, "quantity", e.target.value)}
                />
              </div>
              <div>
                {index === 0 && (
                  <Label className="text-xs text-muted-foreground">Jedn.</Label>
                )}
                <Input
                  placeholder="szt"
                  value={row.unit}
                  onChange={(e) => updateRow(index, "unit", e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeRow(index)}
                aria-label="Usuń wiersz"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={addRow}>
            <Plus className="h-4 w-4 mr-1" />
            Pozycja
          </Button>
          <Button type="button" onClick={generateQr}>
            Generuj QR
          </Button>
        </div>
        {payload && (
          <p className="text-xs text-muted-foreground break-all">
            ID przyjęcia: {payload.intakeId}
          </p>
        )}
      </div>

      <div className="flex flex-col items-center justify-center min-h-[280px] rounded-xl border border-dashed border-muted-foreground/30 bg-muted/20 dark:bg-[#2a2a2a]/50 p-4">
        {payload && qrValue ? (
          <>
            <QRCodeSVG value={qrValue} size={220} level="M" />
            <p className="mt-4 text-sm text-center text-muted-foreground">
              Zeskanuj w aplikacji cms-scanner i potwierdź przyjęcie do magazynu.
            </p>
            {payload.label && (
              <p className="mt-1 font-medium">{payload.label}</p>
            )}
            <ul className="mt-2 text-sm text-center">
              {payload.items.map((item) => (
                <li key={item.name}>
                  {item.quantity} × {item.name}
                  {item.unit ? ` (${item.unit})` : ""}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-muted-foreground text-sm text-center px-4">
            Wypełnij pozycje i kliknij „Generuj QR”, aby wyświetlić kod do skanowania.
          </p>
        )}
      </div>
    </div>
  );
}
