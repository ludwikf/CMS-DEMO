import ProductsTable from "./ProductsTable";
import ErrorBoundary from "./components/ErrorBoundary";
import ProductsTableError from "./components/ProductsTableError";
import { getProducts } from "./lib/getProducts";

interface ProductsPageProps {
  searchParams: {
    template?: string;
    page?: string;
    limit?: string;
    search?: string;
    category?: string;
    status?: string;
  };
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const page = parseInt(searchParams.page || "1");
  const limit = parseInt(searchParams.limit || "10");
  const templateFilter = searchParams.template || null;

  const data = await getProducts({
    page,
    limit,
    search: searchParams.search,
    category: searchParams.category,
    status: searchParams.status,
    template: searchParams.template,
  });

  return (
    <div className="flex flex-col h-full min-h-0">
      <ErrorBoundary fallback={ProductsTableError}>
        <ProductsTable
          initialProducts={data.products}
          initialPagination={data.pagination}
          templateFilter={templateFilter}
          currentPage={page}
          currentLimit={limit}
        />
      </ErrorBoundary>
    </div>
  );
}
