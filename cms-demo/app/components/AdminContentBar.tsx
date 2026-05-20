"use client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export default function AdminContentBar({
  nav1,
  nav2,
  nav3,
  nav4,
  navlink1,
  navlink2,
  navlink3,
  navlink4,
  label1,
  label2,
  label3,
  link1,
  link2,
}: any) {
  const pathName = usePathname();
  return (
    <div
      className={`relative w-screen bg-[#222] text-white flex justify-center items-center ${
        nav1 ? "" : "h-[40px]"
      }`}
    >
      <div className="absolute left-5">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin">Główna</BreadcrumbLink>
            </BreadcrumbItem>
            {label1 && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {label2 ? (
                    <BreadcrumbLink href={link1}>{label1}</BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage className="text-[#999]">
                      {label1}
                    </BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </>
            )}
            {label2 && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {label3 ? (
                    <BreadcrumbLink href={link2}>{label2}</BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage className="text-[#999]">
                      {label2}
                    </BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </>
            )}
            {label3 && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-[#999]">
                    {label3}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex h-[50px] items-center gap-5">
        {nav1 && (
          <>
            <Link
              href={navlink1 || ""}
              className={`rounded-t-lg mb-[-1px] px-5 py-2 transition-all duration-200 hover:bg-white hover:text-black ${
                pathName === navlink1
                  ? "bg-white self-end text-black"
                  : "hover:translate-y-[5.5px]"
              }`}
            >
              {nav1}
            </Link>
          </>
        )}
        {nav2 && (
          <>
            <Link
              href={navlink2 || ""}
              className={`rounded-t-lg mb-[-1px] px-5 py-2 transition-all duration-200 hover:bg-white hover:text-black ${
                pathName === navlink2
                  ? "bg-white self-end text-black"
                  : "hover:translate-y-[5.5px]"
              }`}
            >
              {nav2}
            </Link>
          </>
        )}
        {nav3 && (
          <>
            <Link
              href={navlink3 || ""}
              className={`rounded-t-lg mb-[-1px] px-5 py-2 transition-all duration-200 hover:bg-white hover:text-black ${
                pathName === navlink3
                  ? "bg-white self-end text-black"
                  : "hover:translate-y-[5.5px]"
              }`}
            >
              {nav3}
            </Link>
          </>
        )}
        {nav4 && (
          <>
            <Link
              href={navlink4 || ""}
              className={`rounded-t-lg mb-[-1px] px-5 py-2 transition-all duration-200 hover:bg-white hover:text-black ${
                pathName === navlink4
                  ? "bg-white self-end text-black"
                  : "hover:translate-y-[5.5px]"
              }`}
            >
              {nav4}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
