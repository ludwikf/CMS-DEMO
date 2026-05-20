import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mt-3 flex flex-col gap-5 mx-1">
      <div>
        <Skeleton className="w-full h-[80px]" />
      </div>
      <div>
        <Skeleton className="w-full h-[200px]" />
      </div>
      <div>
        <Skeleton className="w-full h-[200px]" />
      </div>
    </div>
  );
}
