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

export default function Loading() {
  return (
    <div className="w-full flex flex-col items-center px-12">
      <div className="w-full sm:mt-5 mb-10">
        <div className="hidden sm:flex flex-col gap-1 mb-5">
          <div className="text-xl lg:text-3xl font-bold text-panel-title">
            Zamówienia
          </div>
          <div className="text-panel-textMuted text-sm lg:text-base">
            Lista złożonych zamówień
          </div>
        </div>
        <div className="sm:hidden mb-3 flex flex-col gap-1">
          <span className="text-lg font-bold text-panel-title">Zamówienia</span>
          <span className="text-sm text-panel-textMuted">
            Lista złożonych zamówień
          </span>
        </div>

        <Card className="w-full rounded-2xl border border-solid dark:bg-[#1e1e1e] px-2 relative flex flex-col min-h-0">
          <CardContent className="px-3 pb-2 flex flex-col flex-1 min-h-0">
            <div className="pt-5 sm:pt-6 pb-3 border-solid rounded-b-md shadow-sm sticky top-0 z-20 rounded-t-2xl flex-shrink-0 bg-inherit">
              <div className="flex gap-4 h-[40px] items-center">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <Skeleton className="h-10 flex-1 max-w-md" />
                <div className="hidden sm:flex items-center h-full gap-3">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
              <Table className="flex-1 border-b-[0.8px] border-solid border-[#ccc] dark:border-[#333]">
                <TableHeader>
                  <TableRow className="bg-[#f1f1f1] dark:bg-[#2a2a2a] h-14 border-b-0 hover:bg-[#f1f1f1] dark:hover:bg-[#2a2a2a]">
                    <TableHead className="font-medium text-[#444] dark:text-[#aaa] rounded-ss-xl text-base tracking-[0] leading-6">
                      Nr. zamówienia
                    </TableHead>
                    <TableHead className="font-medium text-[#444] dark:text-[#aaa] text-base tracking-[0] leading-6">
                      Zlecenie
                    </TableHead>
                    <TableHead className="font-medium text-[#444] dark:text-[#aaa] text-base tracking-[0] leading-6">
                      Data zamówienia
                    </TableHead>
                    <TableHead className="font-medium text-[#444] dark:text-[#aaa] text-base tracking-[0] leading-6 text-right">
                      Kwota
                    </TableHead>
                    <TableHead className="font-medium text-[#444] dark:text-[#aaa] text-base tracking-[0] leading-6 text-right">
                      Status
                    </TableHead>
                    <TableHead className="font-medium text-[#444] dark:text-[#aaa] rounded-se-xl text-base tracking-[0] leading-6 text-center w-[50px]">
                      Akcje
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow
                      key={i}
                      className="h-[76px] border-b-[0.8px] border-solid border-[#ccc] dark:border-[#333]"
                    >
                      <TableCell>
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-40" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-4 w-16 ml-auto" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-6 w-24 rounded-full ml-auto" />
                      </TableCell>
                      <TableCell className="w-[50px]">
                        <div className="flex justify-center">
                          <Skeleton className="w-8 h-8 rounded-lg" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
