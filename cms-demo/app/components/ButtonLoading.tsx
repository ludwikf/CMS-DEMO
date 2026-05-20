import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ButtonLoadingProps {
  className?: string;
  size?: number;
}

export function ButtonLoading({ className, size = 20 }: ButtonLoadingProps) {
  return (
    <Button disabled className={cn("", className)}>
      <Loader2 className="h-5 w-5 animate-spin" />
    </Button>
  );
}
