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
import { deleteProductRateLimiter } from "@/lib/rateLimiter";
import { PRODUCT_CATEGORY_KEYS } from "@/lib/productCategories";
import { createHmac } from "crypto";
import { cookies } from "next/headers";

const CSRF_SECRET =
  process.env.CSRF_SECRET || "your-secret-key-change-in-production";
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000;

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

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "host") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        pricingTemplate: { select: { id: true, name: true } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const validationErrors = validateDatabaseProduct(product);
    if (validationErrors.length > 0) {
      console.warn(`Product ${id} has validation issues:`, validationErrors);
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "host") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
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

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const duplicateProduct = await prisma.product.findFirst({
      where: {
        category: validatedData.category,
        variant: validatedData.variant,
        id: { not: id },
      },
    });

    if (duplicateProduct) {
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

    const product = await prisma.product.update({
      where: { id },
      data: productData,
    });

    return NextResponse.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "host") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = deleteProductRateLimiter(req as any);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: "Too many delete requests",
          message: "Please wait before deleting another product",
          retryAfter: Math.ceil(
            (rateLimitResult.resetTime - Date.now()) / 1000
          ),
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(
              (rateLimitResult.resetTime - Date.now()) / 1000
            ).toString(),
            "X-RateLimit-Limit": "10",
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
          },
        }
      );
    }

    const cookieStore = cookies();
    const storedToken = cookieStore.get("csrf-token")?.value;

    if (!storedToken) {
      return NextResponse.json(
        { error: "CSRF token required" },
        { status: 403 }
      );
    }

    try {
      const decoded = Buffer.from(storedToken, "base64").toString("utf-8");
      const [timestamp, randomPart, signature] = decoded.split(":");

      if (!timestamp || !randomPart || !signature) {
        return NextResponse.json(
          { error: "Invalid CSRF token format" },
          { status: 403 }
        );
      }

      const expectedSignature = createHmac("sha256", CSRF_SECRET)
        .update(`${timestamp}:${randomPart}`)
        .digest("hex");

      if (signature !== expectedSignature) {
        return NextResponse.json(
          { error: "Invalid CSRF token signature" },
          { status: 403 }
        );
      }

      const tokenTime = parseInt(timestamp);
      if (isNaN(tokenTime) || Date.now() - tokenTime > CSRF_TOKEN_EXPIRY) {
        return NextResponse.json(
          { error: "CSRF token expired" },
          { status: 403 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid CSRF token" },
        { status: 403 }
      );
    }

    const { id } = params;

    if (!id || typeof id !== "string" || !/^[a-zA-Z0-9_-]+$/.test(id)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: { id: true, variant: true },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const product = await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json(product, {
      headers: {
        "X-RateLimit-Limit": "10",
        "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
        "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
      },
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
