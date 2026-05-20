import { ProductProvider } from "@/app/contexts/ProductContext";

export default function ProduktyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProductProvider>{children}</ProductProvider>;
}
