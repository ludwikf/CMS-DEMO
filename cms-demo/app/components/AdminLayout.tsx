"use client";
import AdminSidebar from "./AdminSidebar";
import {
  SidebarTrigger,
  SidebarProvider,
} from "@/components/ui/sidebar";
import NextTopLoader from "nextjs-toploader";
import { usePathname } from "next/navigation";
import { ModeToggle } from "./ModeToggle";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();

  const getPageInfo = () => {
    if (pathname === "/admin/zamowienia") {
      return { title: "Zamówienia", description: "Zarządzaj zamówieniami" };
    }
    if (pathname.startsWith("/admin/zamowienia/")) {
      return { title: "Szczegóły zamówienia", description: "" };
    }
    if (pathname === "/admin/produkty") {
      return { title: "Produkty", description: "Zarządzaj produktami" };
    }
    if (pathname === "/admin/produkty/nowy-produkt") {
      return { title: "Nowy produkt", description: "" };
    }
    if (pathname.startsWith("/admin/produkty/")) {
      return { title: "Edytuj produkt", description: "" };
    }
    if (pathname === "/admin/cennik") {
      return { title: "Cennik", description: "Zarządzaj cennikami" };
    }
    if (pathname === "/admin/cennik/szablon/nowy") {
      return { title: "Nowy cennik", description: "" };
    }
    if (pathname.startsWith("/admin/cennik/szablon/")) {
      return { title: "Edytuj cennik", description: "" };
    }
    return {
      title: "Panel administracyjny",
      description: "Zarządzaj systemem",
    };
  };

  const pageInfo = getPageInfo();

  return (
    <SidebarProvider>
      <NextTopLoader color="#e80050" showSpinner={false} />
      <div className="flex w-full min-h-screen">
        <AdminSidebar className="w-[240px] shrink-0" />
        <div className="flex-1 min-w-0 flex flex-col">
          <header className="flex min-h-16 shrink-0 border-b-[1px] shadow-md z-[50] dark:border-[#444] bg-[#fff] dark:bg-[#222] items-center gap-2">
            <SidebarTrigger className="ml-5" />
            <div className="flex items-center gap-2 px-4 py-3">
              <div>
                <h1 className="text-lg font-semibold">{pageInfo.title}</h1>
                {pageInfo.description && (
                  <p className="text-sm text-muted-foreground">
                    {pageInfo.description}
                  </p>
                )}
              </div>
            </div>
            <div className="ml-auto mr-6">
              <ModeToggle />
            </div>
          </header>
          <div className="flex-1 min-w-0 flex flex-col gap-4 pb-2 p-2 bg-[linear-gradient(180deg,_#f8fafc_0%,_#eaecef_100%)] dark:bg-[linear-gradient(180deg,_#1c1c1c_0%,_#111111_100%)] overflow-x-auto">
            {children}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}

