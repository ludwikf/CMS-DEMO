"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash2, Loader2, Plus } from "lucide-react";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/app/components/DataTable";

interface PricingTemplate {
  id: string;
  name: string;
  template: any;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

interface PricingTemplatesTableProps {
  initialTemplates: PricingTemplate[];
  onRefresh: () => void;
  loading: boolean;
}

const BASE_PATH = "/admin/cennik";

export default function PricingTemplatesTable({
  initialTemplates,
  onRefresh,
  loading,
}: PricingTemplatesTableProps) {
  const router = useRouter();
  const [templates, setTemplates] = useState(initialTemplates);
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [openDeleteIdx, setOpenDeleteIdx] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setTemplates(initialTemplates);
  }, [initialTemplates]);

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      appliedSearch === "" ||
      template.name.toLowerCase().includes(appliedSearch.toLowerCase());
    return matchesSearch;
  });

  const handleDelete = async (templateId: string) => {
    setDeletingId(templateId);
    try {
      const response = await fetch(
        `/api/admin/pricing-templates/${templateId}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        throw new Error("Failed to delete pricing template");
      }

      const result = await response.json();
      setTemplates(templates.filter((t) => t.id !== templateId));

      toast({
        title: "Usunięto szablon cennika",
        description: result.message,
        variant: "success",
      });
    } catch (error) {
      console.error("Error deleting pricing template:", error);
      toast({
        title: "Błąd podczas usuwania szablonu",
        description: "Wystąpił błąd podczas usuwania szablonu cennika",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleRefresh = () => {
    setSearchTerm("");
    setAppliedSearch("");
    onRefresh();
  };

  const handleSearchSubmit = () => {
    setSearchLoading(true);
    setAppliedSearch(searchTerm);
    setTimeout(() => setSearchLoading(false), 300);
  };

  const pagination = {
    page: 1,
    limit: Math.max(filteredTemplates.length, 1),
    totalCount: filteredTemplates.length,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  return (
    <DataTable
      basePath={BASE_PATH}
      searchPlaceholder="Szukaj szablonów cennika..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      onSearchSubmit={handleSearchSubmit}
      onRefresh={handleRefresh}
      loading={loading || searchLoading}
      toolbarRight={
        <Button asChild>
          <Link href="/admin/cennik/szablon/nowy">
            <Plus className="w-4 h-4 mr-[2px]" />
            Dodaj szablon
          </Link>
        </Button>
      }
      entityNamePlural="szablonów"
      emptyMessage="Brak szablonów cennika"
      pagination={pagination}
      onPageChange={() => {}}
    >
      <Table
        className={`flex-1 ${
          filteredTemplates.length > 0
            ? "border-b-[0.8px] border-solid border-[#ccc] dark:border-[#333]"
            : ""
        }`}
      >
        <TableHeader>
          <TableRow className="bg-[#f1f1f1] dark:bg-[#2a2a2a] h-14 border-b-0 hover:bg-[#f1f1f1] dark:hover:bg-[#2a2a2a]">
            <TableHead className="font-medium text-[#444] dark:text-[#aaa] rounded-ss-xl text-base tracking-[0] leading-6">
              Nazwa szablonu
            </TableHead>
            <TableHead className="font-medium text-[#444] dark:text-[#aaa] text-base tracking-[0] leading-6">
              Ostatnia aktualizacja
            </TableHead>
            <TableHead className="font-medium text-[#444] dark:text-[#aaa] text-base tracking-[0] leading-6">
              Użycie
            </TableHead>
            <TableHead className="font-medium text-[#444] dark:text-[#aaa] rounded-se-xl text-base tracking-[0] leading-6 text-center">
              Akcje
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTemplates.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="h-[150px] rounded-b-2xl text-center text-gray-500 dark:text-[#777]"
              >
                Brak szablonów cennika
              </TableCell>
            </TableRow>
          ) : (
            filteredTemplates.map((template) => (
              <TableRow
                key={template.id}
                className="h-[76px] border-b-[0.8px] border-solid border-[#ccc] dark:border-[#333]"
              >
                <TableCell>
                  <div className="text-[#444] text-base dark:text-[#c6c6c6] font-medium">
                    {template.name}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-[#444] dark:text-[#c6c6c6] font-normal text-sm">
                    {new Date(template.updatedAt).toLocaleString("pl-PL", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </TableCell>
                <TableCell>
                  <div
                    className="flex text-mainTheme items-center gap-3 cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/admin/produkty?template=${encodeURIComponent(
                          template.name
                        )}`
                      )
                    }
                  >
                    <Badge className="bg-green-200 dark:bg-green-500/20 text-green-900 dark:text-green-300 hover:bg-green-500/40 dark:hover:bg-green-500/30 rounded-[26843500px] h-[25px] px-3 font-medium text-sm flex items-center gap-1">
                      <span>
                        {template.usageCount !== undefined
                          ? template.usageCount
                          : 0}
                      </span>
                      <svg
                        className="w-4 h-4 opacity-60"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 bg-gray-100 dark:bg-[#333] rounded-lg hover:bg-gray-200"
                      asChild
                    >
                      <Link href={`/admin/cennik/szablon/${template.id}`}>
                        <Edit className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Dialog
                      open={openDeleteIdx === template.id}
                      onOpenChange={(open) =>
                        setOpenDeleteIdx(open ? template.id : null)
                      }
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 bg-red-100 dark:bg-red-500/40 rounded-lg hover:bg-red-200"
                          onClick={() => setOpenDeleteIdx(template.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            Czy na pewno chcesz usunąć ten szablon cennika?
                          </DialogTitle>
                          <DialogDescription>
                            Wszystkie dane tego szablonu zostaną usunięte.
                            Produkty używające tego szablonu zostaną
                            automatycznie ustawione jako nieaktywne.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button
                            variant="destructive"
                            disabled={deletingId === template.id}
                            onClick={async () => {
                              await handleDelete(template.id);
                              setOpenDeleteIdx(null);
                            }}
                          >
                            {deletingId === template.id ? (
                              <Loader2 className="animate-spin w-4 h-4" />
                            ) : (
                              "Usuń"
                            )}
                          </Button>
                          <Button onClick={() => setOpenDeleteIdx(null)}>
                            Anuluj
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </DataTable>
  );
}
