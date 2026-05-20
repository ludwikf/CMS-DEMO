import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ApiError from "@/app/components/ApiError";
import OrderDetailClient from "./OrderDetailClient";

export default async function OrderDetailPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return <ApiError description="Sesja wygasła, zaloguj się ponownie" />;
  }

  return (
    <div>
      <OrderDetailClient />
    </div>
  );
}
