import { ProductProvider } from "@/app/contexts/ProductContext";

export default function NoweZamowienieLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProductProvider>{children}</ProductProvider>;
}
