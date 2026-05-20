import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import { OrderWithItems } from "@/app/types/order";
import { getProductDisplayName } from "@/app/dictionary/dictionary";
import autoTable from "jspdf-autotable";
import fs from "fs";
import path from "path";

type OrderProps = {
  order: OrderWithItems;
};

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { order }: OrderProps = data;

    const doc = new jsPDF();

    const fontPath = path.resolve("public", "roboto-m.ttf");
    const fontData = fs.readFileSync(fontPath);
    doc.addFileToVFS("Roboto-Regular.ttf", fontData.toString("base64"));
    doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");

    const lightFontPath = path.resolve("public", "roboto.ttf");
    const lightFontData = fs.readFileSync(lightFontPath);
    doc.addFileToVFS("Roboto-Bold.ttf", lightFontData.toString("base64"));
    doc.addFont("Roboto-Bold.ttf", "Roboto-Bold", "normal");

    doc.setFont("Roboto-Bold");

    doc.setFontSize(20);
    doc.text(`Nr. zamówienia ${order.orderNumber}`, 15, 20);

    const formattedCreatedAt = new Date(order.createdAt).toLocaleDateString(
      "pl-PL"
    );
    const deliveryMethod =
      order.deliveryMethod === "delivery" ? "Dostawa" : "Odbiór osobisty";

    doc.setFont("Roboto");
    doc.setFontSize(14);
    doc.text(`Zlecenie: ${order.orderName}`, 15, 30);
    doc.text(`Sposób dostawy: ${deliveryMethod}`, 15, 40);
    doc.text(`Data złożenia zamówienia: ${formattedCreatedAt}`, 15, 50);

    let yOffset = 70;
    doc.text("Zamówienie:", 15, yOffset);
    yOffset += 5;

    const tableData = order.items.map((item) => ({
      product: getProductDisplayName(item.product),
      type: item.type,
      width: item.width,
      height: item.height,
      material: item.material,
      color: item.color,
      quantity: item.quantity,
    }));

    const columns = [
      { header: "Produkt", dataKey: "product" },
      { header: "Typ", dataKey: "type" },
      { header: "Szerokość [mm]", dataKey: "width" },
      { header: "Wysokość [mm]", dataKey: "height" },
      { header: "Materiał", dataKey: "material" },
      { header: "Kolor", dataKey: "color" },
      { header: "Ilość", dataKey: "quantity" },
    ];

    autoTable(doc, {
      head: [columns.map((col) => col.header)],
      body: tableData.map((item: any) =>
        columns.map((col) => item[col.dataKey])
      ),
      startY: yOffset,
      margin: { top: 10 },
      theme: "striped",
      pageBreak: "auto",
      styles: {
        font: "Roboto",
        lineWidth: 0.2,
        lineColor: [211, 211, 211],
      },
      headStyles: {
        halign: "center",
        valign: "middle",
        font: "Roboto-Bold",
        lineWidth: 0.2,
        lineColor: [211, 211, 211],
        fillColor: [35, 43, 54],
        textColor: [255, 255, 255],
      },
      bodyStyles: {
        lineWidth: 0.2,
        lineColor: [211, 211, 211],
      },
    });

    doc.save("table.pdf");

    const pdfBlob = doc.output("blob");

    return new NextResponse(pdfBlob, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="Zamowienie.pdf"`,
        "Content-Type": "application/pdf",
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 500 });
    }
    return new NextResponse("An unknown error occurred", { status: 500 });
  }
}
