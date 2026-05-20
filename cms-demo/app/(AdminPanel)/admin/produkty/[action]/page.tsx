import ProductForm from "./ProductForm";
import { fetchProductById } from "./lib/fetchProduct";
import ErrorBoundary from "../components/ErrorBoundary";
import ProductFormError from "../components/ProductFormError";

interface ProductActionPageProps {
  params: { action: string };
}

export default async function ProductActionPage({
  params,
}: ProductActionPageProps) {
  const { action } = params;
  const isAddMode = action === "nowy-produkt";

  const product = isAddMode ? null : await fetchProductById(action);

  return (
    <ErrorBoundary fallback={ProductFormError}>
      <ProductForm initialProduct={product} />
    </ErrorBoundary>
  );
}
