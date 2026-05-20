import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { Order, OrderItemType, OrderWithItems } from "@/app/types/order";
import { getProductDisplayName } from "@/app/dictionary/dictionary";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type OrderProps = {
  order: OrderWithItems;
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session ||
      (session.user.role !== "host" && session.user.role !== "pracownik")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { items, orderDetails }: { items: any; orderDetails: Order } = data;

    const workbook = new ExcelJS.Workbook();

    const worksheet1 = workbook.addWorksheet("Zamówienie");

    worksheet1.columns = [
      { header: "Produkt", key: "product", width: 35 },
      { header: "Typ", key: "type", width: 30 },
      { header: "Szerokość [mm]", key: "width", width: 25 },
      { header: "Wysokość [mm]", key: "height", width: 25 },
      { header: "Materiał", key: "material", width: 25 },
      { header: "Kolor", key: "color", width: 25 },
      { header: "Ilość", key: "quantity", width: 10 },
      { header: "Uwagi", key: "note", width: 30 },
    ];

    items.forEach((item: any) => {
      const productDisplayName = getProductDisplayName(item.product);

      worksheet1.addRow({
        product: productDisplayName,
        type: item.type,
        width: item.width,
        height: item.height,
        material: item.material,
        color: item.color,
        quantity: item.quantity,
        note: item.note,
      });
    });

    worksheet1.getRow(1).height = 40;
    worksheet1.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "232b36" },
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    worksheet1.eachRow((row, rowNumber) => {
      if (rowNumber !== 1) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFB0B0B0" } },
            left: { style: "thin", color: { argb: "FFB0B0B0" } },
            bottom: { style: "thin", color: { argb: "FFB0B0B0" } },
            right: { style: "thin", color: { argb: "FFB0B0B0" } },
          };
          cell.alignment = { vertical: "top", horizontal: "left" };
        });
      }
      if (rowNumber % 2 != 0 && rowNumber != 1) {
        row.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFEEEEEE" },
          };
        });
      }
    });

    worksheet1.getColumn("note").eachCell((cell, rowNumber) => {
      if (rowNumber !== 1) {
        cell.alignment = {
          vertical: "top",
          horizontal: "left",
          wrapText: true,
        };
      }
    });

    const worksheet2 = workbook.addWorksheet("Szczególy zamówienia");

    worksheet2.columns = [
      { header: "Nr. zamówienia", key: "orderNumber" },
      { header: "Zlecenie", key: "orderName" },
      { header: "Sposób dostawy", key: "deliveryMethod" },
      { header: "Data złożenia zamówienia", key: "createdAt" },
    ];

    const formattedCreatedAt = new Date(
      orderDetails.createdAt
    ).toLocaleDateString("pl-PL");
    const deliveryMethod =
      orderDetails.deliveryMethod === "delivery"
        ? "Dostawa"
        : "Odbiór osobisty";

    worksheet2.addRow({
      orderNumber: orderDetails.orderNumber,
      orderName: orderDetails.orderName,
      deliveryMethod: deliveryMethod,
      createdAt: formattedCreatedAt,
    });

    worksheet2.getRow(1).height = 30;
    worksheet2.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "232b36" },
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    worksheet2.eachRow((row, rowNumber) => {
      if (rowNumber !== 1) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFB0B0B0" } },
            left: { style: "thin", color: { argb: "FFB0B0B0" } },
            bottom: { style: "thin", color: { argb: "FFB0B0B0" } },
            right: { style: "thin", color: { argb: "FFB0B0B0" } },
          };
          cell.alignment = { vertical: "top", horizontal: "left" };
        });
      }
    });

    worksheet2.columns.forEach((column) => {
      let maxLength = 5;
      if (column.eachCell) {
        column.eachCell({ includeEmpty: true }, (cell) => {
          const cellValue = cell.value ? cell.value.toString() : "";
          maxLength = Math.max(maxLength, cellValue.length);
        });
      }
      column.width = maxLength + 2;
    });

    const buf = await workbook.xlsx.writeBuffer();

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="Zamowienie.xlsx"`,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 500 });
    }
    return new NextResponse("An unknown error occurred", { status: 500 });
  }
}
