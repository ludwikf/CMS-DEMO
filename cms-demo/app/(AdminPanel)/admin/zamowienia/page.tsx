import OrdersTable from "./components/OrdersTable";
import { getOrders } from "./lib/getOrders";

interface OrdersPageProps {
  searchParams: {
    page?: string;
    limit?: string;
    search?: string;
    status?: string;
    deliveryMethod?: string;
  };
}

export default async function AdminOrdersPage({
  searchParams,
}: OrdersPageProps) {
  const page = parseInt(searchParams.page || "1");
  const limit = parseInt(searchParams.limit || "10");

  const data = await getOrders({
    page,
    limit,
    search: searchParams.search,
    status: searchParams.status,
    deliveryMethod: searchParams.deliveryMethod,
  });

  return (
    <div className="flex flex-col h-full min-h-0">
      <OrdersTable
        initialOrders={data.orders}
        initialPagination={data.pagination}
        currentPage={page}
        currentLimit={limit}
      />
    </div>
  );
}
