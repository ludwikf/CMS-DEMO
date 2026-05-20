import { getWarehouseData } from "./lib/getWarehouseData";
import WarehouseDeliveryForm from "./components/WarehouseDeliveryForm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

const cardClassName =
  "w-full rounded-2xl border border-solid dark:bg-[#1e1e1e] px-2";

export default async function MagazynPage() {
  const { stock, intakes } = await getWarehouseData();

  return (
    <div className="flex flex-col h-full min-h-0 w-full gap-3 mx-1 mt-3 pb-4">
      <Card className={cardClassName}>
        <CardContent className="px-3 py-4">
          <WarehouseDeliveryForm />
        </CardContent>
      </Card>

      <Card className={cardClassName}>
        <CardContent className="px-3 py-4">
          <h2 className="text-lg font-semibold mb-4">Stan magazynu</h2>
          {stock.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Magazyn jest pusty. Zeskanuj pierwszą dostawę w aplikacji mobilnej.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nazwa</TableHead>
                  <TableHead className="text-right">Ilość</TableHead>
                  <TableHead>Jednostka</TableHead>
                  <TableHead>Ostatnia aktualizacja</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stock.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell>{item.unit ?? "szt"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(item.updatedAt, "dd.MM.yyyy HH:mm", {
                        locale: pl,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className={cardClassName}>
        <CardContent className="px-3 py-4">
          <h2 className="text-lg font-semibold mb-4">Historia przyjęć (QR)</h2>
          {intakes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Brak zarejestrowanych przyjęć.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Etykieta</TableHead>
                  <TableHead>Pozycje</TableHead>
                  <TableHead>ID przyjęcia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {intakes.map((intake) => (
                  <TableRow key={intake.id}>
                    <TableCell>
                      {format(new Date(intake.createdAt), "dd.MM.yyyy HH:mm", {
                        locale: pl,
                      })}
                    </TableCell>
                    <TableCell>{intake.label ?? "—"}</TableCell>
                    <TableCell>
                      {intake.items
                        .map((i) => `${i.quantity}× ${i.name}`)
                        .join(", ")}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {intake.intakeId}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
