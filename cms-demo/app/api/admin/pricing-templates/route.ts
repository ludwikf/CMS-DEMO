import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface PricingTableData {
  heights: number[];
  widths: number[];
  prices: number[][];
  tableType?: "regular" | "color";
  colors?: string[];
}

interface PricingRule {
  name: string;
  area?: number;
  material?: any;
  color?: any;
  custom?: Record<string, number>;
}

interface TemplateData {
  pricingRules: Record<string, PricingRule>;
  table?: PricingTableData;
  tables?: Record<string, PricingTableData[]>;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "host" && session.user.role !== "pracownik") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const pricingTemplates = await prisma.pricingTemplate.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    const templatesWithUsage = await Promise.all(
      pricingTemplates.map(async (template) => {
        const usageCount = await prisma.product.count({
          where: {
            pricingTemplateId: template.id,
          },
        });

        return {
          ...template,
          usageCount,
        };
      })
    );

    return NextResponse.json(templatesWithUsage);
  } catch (error) {
    console.error("Error fetching pricing templates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
      where: { name },
    });

    if (existingTemplate) {
      return NextResponse.json(
        { error: "Template with this name already exists" },
        { status: 400 }
      );
    }

    const templateKeys = Object.keys(template);
    const isSingle = templateKeys.length === 1 && templateKeys[0] === "table";
    const isSubvariant = templateKeys.length > 0 && !isSingle;

    if (!isSingle && !isSubvariant) {
      return NextResponse.json(
        {
          error:
            "At least one subvariant is required or a single table must be provided",
        },
        { status: 400 }
      );
    }

    if (isSubvariant) {
      for (const subvariant of templateKeys) {
        const { TABLES } = template[subvariant];
      }
    }

    const newTemplate = await prisma.pricingTemplate.create({
      data: {
        name,
        template,
      },
    });

    return NextResponse.json({
      success: true,
      template: newTemplate,
      message: "Pricing template created successfully",
    });
  } catch (error) {
    console.error("Error creating pricing template:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
