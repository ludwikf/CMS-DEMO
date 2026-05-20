import AdminLayout from "@/app/components/AdminLayout";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function Layout({ children }: React.PropsWithChildren) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  if (session.user.role !== "host" && session.user.role !== "pracownik") {
    redirect("/nowe-zamowienie");
  }

  return <AdminLayout>{children}</AdminLayout>;
}
