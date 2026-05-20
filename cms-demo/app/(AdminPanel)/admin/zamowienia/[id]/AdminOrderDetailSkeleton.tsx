import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminOrderDetailSkeleton() {
  return (
    <div className="px-12">
      <div className="w-full mb-6">
        <Skeleton className="h-5 w-16 mb-2 mt-1" />
        <div className="hidden sm:flex items-center gap-3 mb-2 mt-2">
          <Skeleton className="h-8 w-56 lg:w-72" />
          <Skeleton className="h-7 w-24 rounded-lg" />
        </div>
        <div className="sm:hidden flex items-center gap-2 mb-3 mt-3">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-6 w-20 rounded-lg" />
        </div>

        <Card className="w-full h-full rounded-2xl border border-solid dark:bg-[#1e1e1e] px-2 relative flex flex-col min-h-0">
          <CardContent className="px-3 pb-2 flex flex-col flex-1 min-h-0 overflow-y-auto">
            <div className="pt-5 sm:pt-6 pb-5 border-b border-border space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-5 w-48 max-w-xs" />
                <Skeleton className="h-7 w-24 rounded-lg shrink-0" />
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-36" />
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Skeleton className="h-9 w-24 rounded-md" />
                <Skeleton className="h-9 w-28 rounded-md" />
              </div>
            </div>

            <div className="w-full flex flex-col gap-4 mt-4">
              <div className="px-0 pb-1">
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="rounded-xl border border-border bg-[#f6f6f6] dark:bg-[#282828] overflow-hidden">
                <div className="px-4 pb-4 pt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>

            <div className="w-full flex flex-col gap-4 pt-4 pb-2">
              <div className="px-0 pb-1">
                <Skeleton className="h-4 w-40" />
              </div>
              <div className="rounded-xl border border-border bg-[#fcfcfc] dark:bg-[#232323] overflow-hidden">
                <div className="px-4 py-3 bg-[#f4f4f4] dark:bg-[#272727] border-b border-[#ccc] dark:border-[#555] flex items-center justify-between">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <div className="px-4 pt-2 pb-4">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#ccc] dark:border-[#555]">
                        <TableHead>
                          <Skeleton className="h-4 w-12" />
                        </TableHead>
                        <TableHead>
                          <Skeleton className="h-4 w-24" />
                        </TableHead>
                        <TableHead>
                          <Skeleton className="h-4 w-28" />
                        </TableHead>
                        <TableHead>
                          <Skeleton className="h-4 w-16" />
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[1, 2, 3].map((i) => (
                        <TableRow
                          key={i}
                          className="border-[#ccc] dark:border-[#555]"
                        >
                          <TableCell>
                            <Skeleton className="h-4 w-20" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-16" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-14 ml-auto" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-border flex justify-end">
                <div className="flex items-baseline gap-2">
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
