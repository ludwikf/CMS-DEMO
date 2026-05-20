"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import OrderSum from "./OrderSum";
import { OrderWithItems } from "@/app/types/order";
import ApiError from "@/app/components/ApiError";
import OrderDetailSkeleton from "./OrderDetailSkeleton";

export default function OrderDetailClient() {
  const params = useParams();
  const orderId = params?.id as string | undefined;
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError("Brak ID zamówienia");
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetch(`/api/user/orders/${orderId}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404)
            throw new Error(
              "Zamówienie nie istnieje lub nie masz do niego dostępu"
            );
          throw new Error("Wystąpił błąd");
        }
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setOrder(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message ?? "Wystąpił błąd");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (loading) {
    return <OrderDetailSkeleton />;
  }

  if (error || !order) {
    return <ApiError description={error ?? "Nie znaleziono zamówienia"} />;
  }

  return <OrderSum order={order} />;
}
