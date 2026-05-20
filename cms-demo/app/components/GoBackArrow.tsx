"use client";

import { ArrowLeftIcon } from "@heroicons/react/16/solid";
import { useRouter } from "next/navigation";
import React from "react";

type GoBackArrowProps = {

  ariaLabel?: string;

  className?: string;
};

export default function GoBackArrow({
  ariaLabel = "Powrót",
  className,
}: GoBackArrowProps) {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  return (
    <button
      type="button"
      onClick={handleGoBack}
      aria-label={ariaLabel}
      className={
        className ??
        "inline-flex items-center justify-center p-2 rounded-md text-[#6B7280] hover:text-[#4B5563] hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-colors shrink-0"
      }
    >
      <ArrowLeftIcon className="w-5 h-5" />
    </button>
  );
}
