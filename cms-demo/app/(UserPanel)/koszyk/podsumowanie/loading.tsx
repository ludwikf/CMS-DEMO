import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PodsumowanieLoading() {
  return (
    <div className="w-full flex flex-col items-center px-12">
      <div className="w-full sm:mt-5 mb-10">
        <div className="hidden sm:flex flex-col gap-1 mb-5">
          <Skeleton className="h-8 w-64 lg:w-80" />
          <Skeleton className="h-4 w-full max-w-md mt-1" />
        </div>
        <div className="sm:hidden mb-3 flex flex-col gap-1">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32 mt-1" />
        </div>

        <Card className="w-full rounded-2xl border border-solid dark:bg-[#1e1e1e] px-[3px]">
          <CardContent className="px-3 py-4 flex flex-col flex-1 min-h-0">
            <div className="border border-border bg-[#fcfcfc] dark:bg-[#252525] rounded-lg px-3 py-3 mb-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-72" />
              </div>
            </div>

            <div className="mt-6 mb-3">
              <Skeleton className="h-5 w-24 mb-3" />
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="border border-border bg-[#fcfcfc] dark:bg-[#252525] rounded-lg px-3 py-3 mb-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-border flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Skeleton className="h-6 w-36" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-32 rounded-md" />
                  <Skeleton className="h-10 w-36 rounded-md" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
