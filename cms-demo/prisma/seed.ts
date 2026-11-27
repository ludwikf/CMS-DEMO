import { PrismaClient, Prisma, ProductCategory, ProductStatus, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";
import { createDefaultTemplate } from "../lib/demoPricingTemplate";

const prisma = new PrismaClient();

async function upsertUser(params: {
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone: string;
  companyName: string;
  nip: string;
  city: string;
  address: string;
  zipCode: string;
}) {
  const hashedPassword = await hash(params.password, 10);

  return prisma.user.upsert({
    where: { email: params.email },
    create: {
      email: params.email,
      password: hashedPassword,
      role: params.role,
      isActive: "ACTIVE",
      personalData: {
        create: {
          firstName: params.firstName,
          lastName: params.lastName,
          phone: params.phone,
        },
      },
      company: {
        create: {
          companyName: params.companyName,
          nip: params.nip,
          phone: params.phone,
        },
      },
      shipping: {
        create: {
          city: params.city,
          address: params.address,
          zipCode: params.zipCode,
        },
      },
    },
    update: {
      password: hashedPassword,
      role: params.role,
      isActive: "ACTIVE",
      personalData: {
        upsert: {
          create: {
            firstName: params.firstName,
            lastName: params.lastName,
            phone: params.phone,
          },
          update: {
            firstName: params.firstName,
            lastName: params.lastName,
            phone: params.phone,
          },
        },
      },
      company: {
        upsert: {
          create: {
            companyName: params.companyName,
            nip: params.nip,
            phone: params.phone,
          },
          update: {
            companyName: params.companyName,
            nip: params.nip,
            phone: params.phone,
          },
        },
      },
      shipping: {
        upsert: {
          create: {
            city: params.city,
            address: params.address,
            zipCode: params.zipCode,
          },
          update: {
            city: params.city,
            address: params.address,
            zipCode: params.zipCode,
          },
        },
      },
    },
  });
}

async function main() {
  await upsertUser({
    email: "admin@demo.pl",
    password: "Admin123!",
    role: UserRole.host,
    firstName: "Jan",
    lastName: "Administrator",
    phone: "500100200",
    companyName: "Demo CMS Sp. z o.o.",
    nip: "1234567890",
    city: "Warszawa",
    address: "ul. Przykładowa 1",
    zipCode: "00-001",
  });

  await upsertUser({
    email: "klient@demo.pl",
    password: "Klient123!",
    role: UserRole.klient,
    firstName: "Anna",
    lastName: "Kowalska",
    phone: "500300400",
    companyName: "Firma Klienta Sp. z o.o.",
    nip: "9876543210",
    city: "Kraków",
    address: "ul. Testowa 10",
    zipCode: "30-001",
  });

  const templateData = createDefaultTemplate() as unknown as Prisma.InputJsonValue;

  const pricingTemplate = await prisma.pricingTemplate.upsert({
    where: { name: "Cennik standardowy" },
    create: {
      name: "Cennik standardowy",
      template: templateData,
    },
    update: {
      template: templateData,
    },
  });

  const defaultInputs: Prisma.InputJsonValue = {
    main: [
      { type: "WIDTH", default: 1000, required: true },
      { type: "HEIGHT", default: 1000, required: true },
      {
        type: "COLOR",
        values: ["Standard", "Premium"],
        default: "Standard",
        required: false,
      },
      {
        type: "MODEL",
        values: ["Podstawowy", "Rozszerzony"],
        default: "Podstawowy",
        required: false,
      },
    ],
  };

  await prisma.product.upsert({
    where: {
      category_variant: {
        category: ProductCategory.KATEGORIA_A,
        variant: "Produkt Standard A",
      },
    },
    create: {
      category: ProductCategory.KATEGORIA_A,
      variant: "Produkt Standard A",
      status: ProductStatus.ACTIVE,
      pricingTemplateId: pricingTemplate.id,
      subvariants: [],
      inputs: defaultInputs,
    },
    update: {
      status: ProductStatus.ACTIVE,
      pricingTemplateId: pricingTemplate.id,
      subvariants: [],
      inputs: defaultInputs,
    },
  });

  await prisma.product.upsert({
    where: {
      category_variant: {
        category: ProductCategory.KATEGORIA_B,
        variant: "Produkt Premium B",
      },
    },
    create: {
      category: ProductCategory.KATEGORIA_B,
      variant: "Produkt Premium B",
      status: ProductStatus.ACTIVE,
      pricingTemplateId: pricingTemplate.id,
      subvariants: [],
      inputs: defaultInputs,
    },
    update: {
      status: ProductStatus.ACTIVE,
      pricingTemplateId: pricingTemplate.id,
      subvariants: [],
      inputs: defaultInputs,
    },
  });

  console.log("Seed completed: admin@demo.pl, klient@demo.pl, pricing template, and 2 products.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
