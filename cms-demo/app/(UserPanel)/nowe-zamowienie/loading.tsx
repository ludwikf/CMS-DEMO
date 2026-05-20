import { Skeleton } from "@/components/ui/skeleton";

export default function NoweZamowienieLoading() {
  return (
    <div className="w-full min-w-0 flex flex-col items-center px-4 sm:px-12">
      <div className="w-full min-w-0 sm:mt-8 mb-10">
        <div className="hidden sm:flex flex-col gap-1">
          <Skeleton className="h-8 w-48 lg:w-56" />
          <Skeleton className="h-4 w-72 max-w-md mt-1" />
        </div>
        <div className="sm:hidden mb-3 flex flex-col gap-1">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-52 mt-1" />
        </div>

        <div className="mt-5 gap-6 flex flex-col lg:flex-row lg:items-stretch w-full min-w-0 overflow-hidden">
          <div className="w-full lg:flex-1 lg:min-w-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="w-full min-w-[220px] sm:min-w-[240px] shadow-lg flex flex-col gap-2 p-4 rounded-xl border border-border dark:border-[#333] bg-white dark:bg-[#242424]"
              >
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-5 w-32 sm:w-40" />
                </div>
                <div className="hidden sm:block">
                  <Skeleton className="h-4 w-24 mb-2" />
                </div>
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-md mt-4" />
              </div>
            ))}
          </div>

          <div className="w-full mt-2 lg:mt-0 lg:w-[38%] lg:min-w-[300px] lg:max-w-[530px] shadow-lg flex flex-col gap-2 p-5 rounded-xl bg-white dark:bg-[#242424]">
            <div className="flex justify-between items-center gap-4">
              <div className="flex flex-col gap-1">
                <Skeleton className="h-5 w-28 sm:h-6 sm:w-32" />
                <div className="hidden sm:block">
                  <Skeleton className="h-4 w-48 mt-1" />
                </div>
              </div>
              <Skeleton className="h-10 w-28 rounded-md flex-shrink-0" />
            </div>
            <div className="flex flex-col gap-2 mt-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex flex-row items-center justify-between px-5 py-3 rounded-xl gap-2 bg-[#f6f6f6] dark:bg-[#343434]"
                >
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-16 rounded" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
