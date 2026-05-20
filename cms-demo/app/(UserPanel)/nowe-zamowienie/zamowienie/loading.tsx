import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-60px)] bg-[#fcfcfc] dark:bg-[#1c1c1c]">
      <aside className="fixed left-0 top-0 hidden h-[100dvh] w-[400px] flex-shrink-0 border-r border-gray-200 bg-[#fafbfc] dark:border-[#333] dark:bg-[#242424] lg:flex lg:flex-col">
        <header className="mt-[70px] px-4 pb-1 pt-[22px]">
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-8 w-44" />
                <Skeleton className="h-4 w-36" />
              </div>
              <Skeleton className="h-[35px] w-[35px] rounded-md" />
            </div>
            <Skeleton className="h-8 w-full" />
          </div>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={`order-card-${idx}`}
              className="rounded-xl border border-gray-200 bg-white p-4 dark:border-[#333] dark:bg-[#242424]"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-14" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 px-4 py-5 dark:border-[#333]">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-7 w-24" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        </div>
      </aside>

      <main className="flex min-h-[calc(100vh-60px)] flex-col px-3 sm:px-8 md:px-8 lg:ml-[400px]">
        <div className="sticky top-0 z-30 flex gap-3 border-b border-gray-200 bg-white px-3 py-4 dark:border-[#333] dark:bg-[#242424] lg:hidden">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>

        <div className="pt-16">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
              <div className="w-full space-y-2">
                <Skeleton className="mx-auto h-8 w-48 sm:mx-0" />
                <Skeleton className="mx-auto h-4 w-32 sm:mx-0" />
              </div>
              <Skeleton className="h-10 w-full sm:w-44" />
            </div>

            {Array.from({ length: 2 }).map((_, idx) => (
              <div
                key={`config-skeleton-${idx}`}
                className="rounded-lg border bg-white p-6 shadow-lg dark:border-[#444] dark:bg-[#333]"
              >
                <div className="mb-4 flex items-center">
                  <Skeleton className="h-6 w-32" />
                  <div className="ml-2 flex items-center gap-2">
                    <Skeleton className="h-6 w-6 rounded" />
                    <Skeleton className="h-6 w-6 rounded" />
                  </div>
                </div>

                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <Skeleton className="h-20 w-full" />
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-gray-200 pt-3 dark:border-[#444]">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
