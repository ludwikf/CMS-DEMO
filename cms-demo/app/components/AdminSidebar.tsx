"use client";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Package,
  ClipboardList,
  Calculator,
  X,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { APP_NAME_ADMIN } from "@/lib/branding";

export default function AdminSidebar({ className }: { className?: string }) {
  const pathName = usePathname();
  const { setOpenMobile } = useSidebar();

  const menuItems = [
    {
      title: "Zamówienia",
      href: "/admin/zamowienia",
      icon: ClipboardList,
      isActive: pathName.startsWith("/admin/zamowienia"),
    },
    {
      title: "Produkty",
      href: "/admin/produkty",
      icon: Package,
      isActive: pathName.startsWith("/admin/produkty"),
    },
    {
      title: "Cennik",
      href: "/admin/cennik",
      icon: Calculator,
      isActive: pathName.startsWith("/admin/cennik"),
    },
  ];

  return (
    <Sidebar
      collapsible="icon"
      className={`border-r-[#d2d2d2] dark:border-r-[#444] z-[60] ${
        className || ""
      }`}
    >
      <SidebarHeader className="border-b group-data-[collapsible=icon]:py-4 border-[#ccc] dark:border-[#444]">
        <div className="flex flex-col p-2 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-2">
            <Link
              href="/nowe-zamowienie"
              className="font-semibold text-base sm:text-lg whitespace-nowrap text-[#1E293B] dark:text-white hover:text-mainTheme"
            >
              {APP_NAME_ADMIN}
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto md:hidden p-1 h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-700"
              onClick={() => setOpenMobile(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center w-full h-10">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-8 h-8 bg-mainTheme rounded-lg flex items-center justify-center cursor-pointer">
                  <span className="text-white text-xs font-bold">B2B</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" align="center">
                {APP_NAME_ADMIN}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.isActive}
                    tooltip={item.title}
                    size="lg"
                    className={`!p-3 !h-10 group-data-[collapsible=icon]:!justify-center ${
                      item.isActive
                        ? "!bg-mainTheme !text-white hover:!bg-mainThemeHover"
                        : ""
                    }`}
                  >
                    <Link
                      href={item.href}
                      className="flex items-center w-full group-data-[collapsible=icon]:justify-center"
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span className="ml-2 group-data-[collapsible=icon]:hidden">
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-[#ccc] dark:border-[#444] p-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center group-data-[collapsible=icon]:justify-center"
          onClick={() => {
            localStorage.removeItem("expireTime");
            signOut({ callbackUrl: "/" });
          }}
        >
          <LogOut className="w-4 h-4 mr-2 group-data-[collapsible=icon]:mr-0" />
          <span className="group-data-[collapsible=icon]:hidden">Wyloguj</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}


