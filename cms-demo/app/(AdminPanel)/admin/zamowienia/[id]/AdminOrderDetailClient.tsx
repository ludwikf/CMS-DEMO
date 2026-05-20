"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { OrderWithItems } from "@/app/types/order";
import ApiError from "@/app/components/ApiError";
import AdminOrderDetailSkeleton from "./AdminOrderDetailSkeleton";
import AdminOrderSum from "./AdminOrderSum";

async function refetchOrder(orderId: string): Promise<OrderWithItems | null> {
  const res = await fetch(`/api/admin/orders/${orderId}`);
  if (!res.ok) return null;
  return res.json();
}

export default function AdminOrderDetailClient() {
  const params = useParams();
  const orderId = params?.id as string | undefined;
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!orderId) return;
    const data = await refetchOrder(orderId);
    if (data) setOrder(data);
  }, [orderId]);

  useEffect(() => {
    if (!orderId) {
      setError("Brak ID zamówienia");
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetch(`/api/admin/orders/${orderId}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) throw new Error("Zamówienie nie istnieje");
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
    return <AdminOrderDetailSkeleton />;
  }

  if (error || !order) {
    return <ApiError description={error ?? "Nie znaleziono zamówienia"} />;
  }

  return <AdminOrderSum order={order} onStatusChange={refetch} />;
}
