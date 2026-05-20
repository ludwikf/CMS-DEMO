import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[#ddd] dark:bg-[#444]",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
