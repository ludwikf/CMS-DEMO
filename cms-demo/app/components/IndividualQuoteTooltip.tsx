"use client";

import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Variant = "single" | "sum";

const TOOLTIP_CONTENT: Record<Variant, React.ReactNode> = {
  single: <p className="text-center">Wymagana wycena indywidualna</p>,
  sum: (
    <p className="text-center">
      Suma nie uwzględnia produktów
      <br />
      wymagających wyceny indywidualnej
    </p>
  ),
};

interface IndividualQuoteTooltipProps {
  variant: Variant;
  className?: string;
}

export function IndividualQuoteTooltip({
  variant,
  className,
}: IndividualQuoteTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={50}>
        <TooltipTrigger asChild>
          <span className={cn("inline-flex items-center", className)}>
            <HelpCircle className="h-5 w-5 text-yellow-500 opacity-70" />
          </span>
        </TooltipTrigger>
        <TooltipContent>{TOOLTIP_CONTENT[variant]}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
