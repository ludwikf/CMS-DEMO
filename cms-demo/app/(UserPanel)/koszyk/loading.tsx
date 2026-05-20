import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function KoszykLoading() {
  return (
    <div className="w-full flex flex-col items-center px-12">
      <div className="w-full sm:mt-5 mb-10">
        <div className="hidden sm:flex flex-col gap-1 mb-5">
          <Skeleton className="h-8 w-32 lg:w-40" />
          <Skeleton className="h-4 w-64 max-w-md mt-1" />
        </div>
        <div className="sm:hidden mb-3 flex flex-col gap-1">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-36 mt-1" />
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <Card className="flex-1 w-full rounded-2xl border border-solid dark:bg-[#1e1e1e] px-2 flex flex-col min-h-0">
            <CardContent className="px-3 pb-5 flex flex-col flex-1 min-h-0">
              <div className="pt-5 sm:pt-3 pb-3 flex-shrink-0 flex items-center gap-2">
                <Skeleton className="h-8 w-32 rounded-md" />
                <Skeleton className="h-8 w-36 rounded-md" />
              </div>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border bg-[#f6f6f6] dark:bg-[#282828] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Skeleton className="h-5 w-5 shrink-0 rounded" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-5 w-full max-w-[280px] sm:max-w-sm" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 sm:pl-4">
                      <Skeleton className="h-9 w-24 rounded-md" />
                      <Skeleton className="h-9 w-9 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="w-full lg:w-80 rounded-2xl border border-solid dark:bg-[#1e1e1e] px-2 h-fit flex-shrink-0">
            <CardContent className="px-3 py-5">
              <Skeleton className="h-6 w-32 mb-3" />
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-6" />
                </div>
                <div className="flex justify-between pt-2 border-t border-border mt-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
              <Skeleton className="h-10 w-full rounded-md" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
