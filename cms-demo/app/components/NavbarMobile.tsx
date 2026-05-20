"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Plus, ShoppingCart, LogOut, Shield } from "lucide-react";
import { ModeToggle } from "./ModeToggle";
import { signOut, useSession } from "next-auth/react";
import { useCart } from "@/app/contexts/CartContext";
import { APP_NAME, APP_NAME_ADMIN } from "@/lib/branding";

const navLinks = [
  { href: "/nowe-zamowienie", label: "Złóż zamówienie", icon: Plus },
  { href: "/zamowienia", label: "Zamówienia", icon: ShoppingCart },
  { href: "/koszyk", label: "Koszyk", icon: ShoppingCart, showBadge: true },
];

export default function NavbarMobile() {
  const [open, setOpen] = React.useState(false);
  const pathName = usePathname();
  const { data: session } = useSession();
  const { items: cartItems } = useCart() ?? { items: [] };
  const cartCount = cartItems.length;

  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <nav className="w-full h-16 flex items-center justify-between px-4 shadow-lg border-b-2 dark:border-[#333] bg-white dark:bg-[#232323] z-50 fixed">
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="font-semibold text-sm text-gray-800 dark:text-white sm:hidden">
          {APP_NAME}
        </span>
        <button
          className="p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-mainTheme hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          onClick={() => setOpen(true)}
          aria-label="Otwórz menu"
        >
          <Menu size={24} className="text-gray-700 dark:text-gray-300" />
        </button>
      </div>
      <ModeToggle />
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white dark:bg-[#232323] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out
        ${open ? "translate-x-0" : "-translate-x-full"} flex flex-col`}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <span className="font-semibold text-lg text-gray-800 dark:text-white">
            {APP_NAME}
          </span>
          <button
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => setOpen(false)}
            aria-label="Zamknij menu"
          >
            <X size={24} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        <div className="flex-1 p-4 space-y-2">
          {navLinks.map(({ href, label, icon: Icon, showBadge }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathName === href || pathName.startsWith(href + "/")
                  ? "bg-mainTheme text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              onClick={() => setOpen(false)}
            >
              <span className="relative">
                <Icon size={18} />
                {showBadge && cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-mainTheme text-white text-[10px] font-semibold px-1">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </span>
              {label}
            </Link>
          ))}
          {(session?.user?.role === "pracownik" ||
            session?.user?.role === "host") && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-800 mt-4">
              <Link
                href="/admin/zamowienia"
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-mainTheme hover:bg-mainTheme/10"
                onClick={() => setOpen(false)}
              >
                <Shield size={18} />
                {APP_NAME_ADMIN}
              </Link>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <button
            className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
            onClick={() => {
              localStorage.removeItem("expireTime");
              signOut({ callbackUrl: "/" });
            }}
          >
            <LogOut size={18} />
            Wyloguj się
          </button>
        </div>
      </div>
    </nav>
  );
}



