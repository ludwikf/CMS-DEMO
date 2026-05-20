import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "host" && session.user.role !== "pracownik") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const template = await prisma.pricingTemplate.findUnique({
      where: { id: params.id },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    if (
      !template ||
      typeof template.template !== "object" ||
      template.template === null
    ) {
      return NextResponse.json(
        { error: "Template data missing or malformed" },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error fetching pricing template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "host" && session.user.role !== "pracownik") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, template } = await request.json();

    if (!name || !template) {
      return NextResponse.json(
        { error: "Name and template are required" },
        { status: 400 }
      );
    }

    const existingTemplate = await prisma.pricingTemplate.findUnique({
      where: { id: params.id },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    const nameExists = await prisma.pricingTemplate.findFirst({
      where: {
        name,
        id: { not: params.id },
      },
    });

    if (nameExists) {
      return NextResponse.json(
        { error: "Template with this name already exists" },
        { status: 400 }
      );
    }

    const updatedTemplate = await prisma.pricingTemplate.update({
      where: { id: params.id },
      data: {
        name,
        template,
      },
    });

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    console.error("Error updating pricing template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "host" && session.user.role !== "pracownik") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;

    const productsUsingTemplate = await prisma.product.findMany({
      where: {
        pricingTemplateId: id,
      },
    });

    if (productsUsingTemplate.length > 0) {
      await prisma.product.updateMany({
        where: {
          pricingTemplateId: id,
        },
        data: {
          status: "INACTIVE",
          pricingTemplateId: null,
        },
      });
    }

    const primaryResult = await prisma.pricingTemplate.delete({
      where: { id },
    });

    const message =
      productsUsingTemplate.length > 0
        ? `Ilość produktów: ${productsUsingTemplate.length}; używających tego szablonu zostało ustawionych jako nieaktywne.`
        : "Szablon cennika został pomyślnie usunięty";

    return NextResponse.json({
      message: message,
    });
  } catch (error) {
    console.error("Error deleting pricing template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
