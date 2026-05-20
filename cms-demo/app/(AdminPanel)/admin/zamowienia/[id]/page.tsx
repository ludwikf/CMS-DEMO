import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ApiError from "@/app/components/ApiError";
import AdminOrderDetailClient from "./AdminOrderDetailClient";

export default async function AdminOrderDetailPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "host") {
    return (
      <ApiError description="Brak uprawnień. Zaloguj się jako administrator." />
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <AdminOrderDetailClient />
    </div>
  );
}
