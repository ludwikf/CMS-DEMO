import React from "react";
import SuccessContent from "./SuccessContent";

type PageProps = {
  params: { id: string };
  searchParams: { orderName?: string; amount?: string };
};

export default function SuccessPage({ params, searchParams }: PageProps) {
  const { id } = params;
  const orderName = searchParams.orderName ?? null;
  const amountRaw = searchParams.amount;
  const amount =
    amountRaw != null && amountRaw !== ""
      ? Number.parseFloat(amountRaw)
      : null;

  return (
    <SuccessContent
      orderId={id}
      orderName={orderName}
      amount={Number.isFinite(amount) ? amount : null}
    />
  );
}
