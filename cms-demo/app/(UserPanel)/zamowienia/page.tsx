import React from "react";
import Orders from "./Orders";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ApiError from "@/app/components/ApiError";

export default async function Zamowienia() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return <ApiError description="Sesja wygasła, zaloguj się ponownie" />;
  }

  return (
    <div>
      <Orders userId={session.user.id} />
    </div>
  );
}
