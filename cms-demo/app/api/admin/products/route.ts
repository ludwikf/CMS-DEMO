import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { PRODUCT_INPUT_TYPES } from "@/app/contexts/inputTypes";
import {
  validateProduct,
  validateProductWithZod,
  validateDatabaseProduct,
} from "@/lib/productValidation";
import {
  PRODUCT_CATEGORY_KEYS,
  getCategoryFilterValues,
} from "@/lib/productCategories";

const inputConfigSchema = z.object({
  type: z.enum(PRODUCT_INPUT_TYPES.map((i) => i.id) as [string, ...string[]]),
  default: z.union([z.string(), z.number(), z.null()]).optional(),
  values: z.any().optional(),
  required: z.boolean().optional(),
});

const productSchema = z.object({
  category: z.enum(PRODUCT_CATEGORY_KEYS),
  variant: z.string().min(1, "Variant is required"),
  status: z.enum(["ACTIVE", "INACTIVE", "TEST"]).default("ACTIVE"),
  pricingTemplateId: z.string().optional(),
  inputsBySubvariant: z.record(z.string(), z.array(inputConfigSchema)),
  subvariants: z.array(z.string()).nullable().optional(),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "host") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const template = searchParams.get("template");

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { variant: { contains: search, mode: "insensitive" } },
        {
          pricingTemplate: {
            name: { contains: search, mode: "insensitive" },
          },
        },
      ];
    }

    if (category && category !== "all") {
      const filterValues = getCategoryFilterValues(category);
      whereClause.category =
        filterValues.length === 1 ? filterValues[0] : { in: filterValues };
    }

    if (status && status !== "all") {
      whereClause.status = status;
    }

    if (template && template !== "all") {
      whereClause.pricingTemplate = {
        name: template,
      };
    }

    const totalCount = await prisma.product.count({
      where: whereClause,
    });

    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        pricingTemplate: { select: { name: true } },
      },
      skip: offset,
      take: limit,
    });

    const productsWithIssues: any[] = [];

    setImmediate(() => {
      products.forEach((product) => {
        const validationErrors = validateDatabaseProduct(product);
        if (validationErrors.length > 0) {
          productsWithIssues.push({
            id: product.id,
            variant: product.variant,
            errors: validationErrors,
          });
        }
      });

      if (productsWithIssues.length > 0) {
        console.warn(
          `${productsWithIssues.length} products have validation issues:`,
          productsWithIssues
        );
      }
    });

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "host") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const validationErrors = validateProduct(body);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: "Product validation failed",
          details: validationErrors,
        },
        { status: 400 }
      );
    }

    const zodValidation = validateProductWithZod(body);
    if (!zodValidation.isValid) {
      return NextResponse.json(
        {
          error: "Product structure validation failed",
          details: zodValidation.errors,
        },
        { status: 400 }
      );
    }

    const validatedData = productSchema.parse(body);

    const existingProduct = await prisma.product.findFirst({
      where: {
        category: validatedData.category,
        variant: validatedData.variant,
      },
    });

    if (existingProduct) {
      return NextResponse.json(
        {
          error: "Variant name already exists in this category",
          details: [
            {
              path: ["variant"],
              message: "Wariant o tej nazwie już istnieje w tej kategorii",
            },
          ],
        },
        { status: 400 }
      );
    }

    const productData: any = {
      category: validatedData.category,
      variant: validatedData.variant,
      status: validatedData.status,
      inputs: validatedData.inputsBySubvariant,
    };

    if (validatedData.pricingTemplateId) {
      productData.pricingTemplateId = validatedData.pricingTemplateId;
    }

    if (validatedData.subvariants && validatedData.subvariants.length > 0) {
      productData.subvariants = validatedData.subvariants;
    } else {
      productData.subvariants = [];
    }

    const product = await prisma.product.create({
      data: productData,
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
