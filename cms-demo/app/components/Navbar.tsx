"use client";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { ModeToggle } from "./ModeToggle";
import { LogOut, ShoppingCart } from "lucide-react";
import { useCart } from "@/app/contexts/CartContext";
import { APP_NAME } from "@/lib/branding";

export default function Navbar() {
  const { data: session } = useSession();
  const pathName = usePathname();
  const { items: cartItems } = useCart() ?? { items: [] };
  const cartCount = cartItems.length;
  return (
    <div className="w-screen bg-[#f9f9f9] dark:bg-[#222] h-[70px] fixed flex justify-between items-center shadow-lg border-b-2 border-transparent dark:border-[#333] z-[50]">
      <div className="flex justify-start items-center gap-6 xl:gap-10 pl-5 flex-1 min-w-0">
        <div className="flex items-center gap-3 shrink-0">
          <span className="font-semibold text-base sm:text-lg whitespace-nowrap text-[#1E293B] dark:text-white">
            {APP_NAME}
          </span>
        </div>
        <div className="flex items-center gap-5 xl:gap-10 text-secondLight dark:text-secondDark">
          <Link
            href={"/nowe-zamowienie"}
            className={`transition border-b-2 box-border  ${
              pathName.startsWith("/nowe-zamowienie")
                ? "text-mainTheme border-mainTheme"
                : "border-transparent"
            } hover:text-mainTheme`}
          >
            Złóż zamówienie
          </Link>

          <Link
            href={"/zamowienia"}
            className={`transition border-b-2 box-border  ${
              pathName.startsWith("/zamowienia")
                ? "text-mainTheme border-mainTheme"
                : "border-transparent"
            } hover:text-mainTheme`}
          >
            Zamówienia
          </Link>
        </div>
      </div>
      <div className="flex justify-end items-center pr-5 gap-3 shrink-0">
        <Link
          href={"/koszyk"}
          className={`p-2 rounded-[10px] transition-all duration-300 bg-[#eee] text-gray-600 hover:bg-[#e5e7eb] dark:bg-[#444] dark:text-white dark:hover:bg-[#555] relative`}
        >
          <ShoppingCart className="w-[17px] h-[17px]" />
          {cartCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-mainTheme text-white text-[11px] px-1">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </Link>
        <ModeToggle />
        <div
          className="h-6 w-px bg-gray-300 dark:bg-[#555] shrink-0"
          aria-hidden
        />
        {(session?.user?.role === "host" ||
          session?.user?.role === "pracownik") && (
          <Link
            href={"/admin/zamowienia"}
            className="px-3 py-2 flex items-center text-mainTheme font-bold gap-2 text-[13px] rounded-[10px] transition-all duration-300 bg-[#eee] text-gray-600 hover:bg-[#e5e7eb] dark:bg-[#444] dark:hover:bg-[#555]"
          >
            Admin
          </Link>
        )}

        <div
          className={`p-2 flex items-center gap-2 cursor-pointer text-sm rounded-[10px] transition-all duration-300 bg-mainTheme text-white hover:bg-[#D00048] dark:hover:bg-[#d00049b6] relative`}
          onClick={() => {
            localStorage.removeItem("expireTime");
            signOut({ callbackUrl: "/" });
          }}
        >
          <LogOut className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}


