import Order from "./Order";
import ErrorBoundary from "@/app/(AdminPanel)/admin/produkty/components/ErrorBoundary";
import OrderError from "./OrderError";

export default function OrderPage() {
  return (
    <ErrorBoundary fallback={OrderError}>
      <Order />
    </ErrorBoundary>
  );
}
