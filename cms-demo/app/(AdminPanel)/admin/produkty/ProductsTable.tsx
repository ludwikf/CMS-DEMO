"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash2, Loader2, Plus } from "lucide-react";
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  Component,
} from "react";
import Link from "next/link";
import { Product } from "@/app/types/product";
import { useRouter, useSearchParams } from "next/navigation";
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
import {
  categories,
  getCategoryLabel,
  PRODUCT_CATEGORY_KEYS,
  ProductCategory,
} from "@/lib/productCategories";
import { DataTable } from "@/app/components/DataTable";
import { FilterPopoverFrame } from "@/app/components/DataTable/FilterPopoverFrame";

const safeTruncateText = (input: string, maxLength: number = 1000): string => {
  if (typeof input !== "string") return "";

  let sanitized = input.trim();

  sanitized = sanitized
    .replace(/<[^>]*>/g, "")
    .replace(/[<>'"&]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/data:/gi, "")
    .replace(/vbscript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/&#x?[0-9a-f]+;/gi, "")
    .replace(/&[a-z]+;/gi, "")
    .replace(/[\x00-\x1F\x7F-\x9F]/g, "")
    .replace(/[\u2000-\u200F\u2028-\u202F\u205F-\u206F\u3000]/g, "");
  sanitized = sanitized
    .replace(/expression\s*\(/gi, "")
    .replace(/url\s*\(/gi, "")
    .replace(/@import/gi, "")
    .replace(/eval\s*\(/gi, "")
    .replace(/setTimeout\s*\(/gi, "")
    .replace(/setInterval\s*\(/gi, "");
  sanitized = sanitized.replace(/\s+/g, " ").trim();

  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength).trim() + "...";
  }

  return sanitized;
};

const extractSafeErrorMessage = (responseText: string): string => {
  try {
    const sanitizedText = responseText
      .replace(/<[^>]*>/g, "")
      .replace(/[<>'"&]/g, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "")
      .substring(0, 500);

    const parsed = JSON.parse(sanitizedText);

    const safeErrors = [
      "An error occurred",
      "Invalid request",
      "Unauthorized access",
      "Resource not found",
      "Server error",
      "Request timeout",
      "Too many requests",
    ];

    const errorMessage = parsed.error || "An error occurred";

    if (safeErrors.includes(errorMessage)) {
      return errorMessage;
    }

    return "An error occurred";
  } catch {
    return "An error occurred";
  }
};

const isValidUrlParam = (param: string | null): boolean => {
  if (!param || typeof param !== "string") return false;

  if (param.length > 50 || param.length < 1) return false;

  const safePattern = /^[a-zA-Z0-9_-]+$/;
  if (!safePattern.test(param)) return false;

  const dangerousPatterns = [
    /[<>'"]/,
    /[&]/,
    /[;]/,
    /[|]/,
    /[`]/,
    /[()]/,
    /[{}]/,
    /[\[\]]/,
    /[!@#$%^&*+=]/,
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /on\w+\s*=/i,
    /&#x?[0-9a-f]+;/i,
    /[\x00-\x1F\x7F-\x9F]/,
    /[\u2000-\u200F\u2028-\u202F\u205F-\u206F\u3000]/,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(param)) {
      logSecurityEvent("SUSPICIOUS_URL_PARAM", {
        action: "url_validation_failed",
        inputLength: param.length,
        validationFailed: true,
        pattern: pattern.toString(),
      });
      return false;
    }
  }

  return true;
};

const logSecurityEvent = (eventType: string, details: any) => {
  if (process.env.NODE_ENV === "production") {
    const securityEvent = {
      eventType,
      timestamp: new Date().toISOString(),
      userAgent:
        typeof window !== "undefined" ? window.navigator.userAgent : "unknown",
      url: typeof window !== "undefined" ? window.location.href : "unknown",
      details: {
        action: details.action || "unknown",
        inputLength: details.inputLength || 0,
        validationFailed: details.validationFailed || false,
      },
    };

    console.warn("Security Event:", securityEvent);
  }
};

const sanitizeSearchInput = (input: string): string => {
  if (typeof input !== "string") return "";

  let sanitized = input.trim();

  sanitized = sanitized
    .replace(/<[^>]*>/g, "")
    .replace(/[<>'"&]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/data:/gi, "")
    .replace(/vbscript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/&#x?[0-9a-f]+;/gi, "")
    .replace(/&[a-z]+;/gi, "")
    .replace(/[\x00-\x1F\x7F-\x9F]/g, "")
    .replace(/[\u2000-\u200F\u2028-\u202F\u205F-\u206F\u3000]/g, "")
    .replace(/expression\s*\(/gi, "")
    .replace(/url\s*\(/gi, "")
    .replace(/@import/gi, "")
    .replace(/eval\s*\(/gi, "")
    .replace(/setTimeout\s*\(/gi, "")
    .replace(/setInterval\s*\(/gi, "");

  const dangerousChars = /[';|&!@#$%^()+={}[\]\\:;"'<>?/~`-]/g;
  const dangerousWords =
    /(union|select|insert|update|delete|drop|create|alter|exec|execute|script|iframe|object|embed|form|input|textarea|button)/gi;

  sanitized = sanitized.replace(dangerousChars, "").replace(dangerousWords, "");

  sanitized = sanitized.replace(/\s+/g, " ").trim().substring(0, 1000);

  if (sanitized.length < input.length * 0.5) {
    logSecurityEvent("SUSPICIOUS_SEARCH_INPUT", {
      action: "search_input_heavily_sanitized",
      inputLength: input.length,
      outputLength: sanitized.length,
      validationFailed: false,
    });
  }

  return sanitized;
};

class TableErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ProductsTable Error: Component crashed");

    if (process.env.NODE_ENV === "production") {
      const sanitizedError = {
        component: "ProductsTable",
        errorType: "ComponentError",
        timestamp: new Date().toISOString(),
        userAgent:
          typeof window !== "undefined"
            ? window.navigator.userAgent
            : "unknown",
      };
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h3 className="text-lg font-semibold text-red-600 mb-2">
            Wystąpił błąd podczas ładowania tabeli
          </h3>
          <p className="text-gray-600 mb-4">
            Odśwież stronę lub skontaktuj się z administratorem.
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Odśwież stronę
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

interface PaginationData {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface ProductsTableProps {
  initialProducts: Product[];
  initialPagination: PaginationData;
  templateFilter: string | null;
  currentPage: number;
  currentLimit: number;
}

export default function ProductsTable({
  initialProducts,
  initialPagination,
  templateFilter,
  currentPage,
  currentLimit,
}: ProductsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState(initialProducts);
  const [pagination, setPagination] = useState(initialPagination);
  const getValidatedCategory = (): string | null => {
    const category = searchParams.get("category");
    const allowedCategories = [...PRODUCT_CATEGORY_KEYS];
    return isValidUrlParam(category) &&
      allowedCategories.includes(category as ProductCategory)
      ? category
      : null;
  };

  const getValidatedStatus = (): string | null => {
    const status = searchParams.get("status");
    const allowedStatuses = ["ACTIVE", "INACTIVE", "TEST"];
    return isValidUrlParam(status) && allowedStatuses.includes(status!)
      ? status
      : null;
  };

  const getValidatedSearch = (): string => {
    const search = searchParams.get("search");
    if (!search) return "";
    return sanitizeSearchInput(search);
  };

  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    getValidatedCategory()
  );
  const [selectedStatus, setSelectedStatus] = useState<string | null>(
    getValidatedStatus()
  );
  const [searchTerm, setSearchTerm] = useState(getValidatedSearch());
  const [openDeleteIdx, setOpenDeleteIdx] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterLoading, setFilterLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDeleteRef = useRef<number>(0);
  const lastFilterRef = useRef<number>(0);
  const filterCountRef = useRef<number>(0);
  const filterResetTimeRef = useRef<number>(0);

  const { toast } = useToast();

  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedCategory && selectedCategory !== "all") count++;
    if (selectedStatus && selectedStatus !== "all") count++;
    if (templateFilter && templateFilter !== "all") count++;
    return count;
  };

  const canPerformDelete = (): boolean => {
    const now = Date.now();
    const timeSinceLastDelete = now - lastDeleteRef.current;

    if (timeSinceLastDelete < 500) {
      return false;
    }

    lastDeleteRef.current = now;
    return true;
  };

  const canPerformFilter = (): boolean => {
    const now = Date.now();
    const timeSinceLastFilter = now - lastFilterRef.current;

    if (now - filterResetTimeRef.current > 10000) {
      filterCountRef.current = 0;
      filterResetTimeRef.current = now;
    }

    if (filterCountRef.current >= 20) {
      return false;
    }

    if (timeSinceLastFilter < 100) {
      return false;
    }

    lastFilterRef.current = now;
    filterCountRef.current++;
    return true;
  };

  const getCsrfToken = async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/csrf-token", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Brak autoryzacji",
            description: "Musisz być zalogowany jako administrator",
            variant: "destructive",
          });
        } else if (response.status === 429) {
          toast({
            title: "Zbyt wiele żądań",
            description: "Poczekaj chwilę przed ponowną próbą",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Błąd podczas pobierania tokenu",
            description: "Spróbuj ponownie za chwilę",
            variant: "destructive",
          });
        }
        return false;
      }

      const data = await response.json();

      if (!data.success) {
        console.error("Invalid CSRF token response received");
        return false;
      }

      return true;
    } catch (error) {
      console.error("Failed to get CSRF token:", error);
      toast({
        title: "Błąd połączenia",
        description: "Nie udało się pobrać tokenu bezpieczeństwa",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    setProducts(initialProducts);
    setPagination(initialPagination);
    setFilterLoading(false);
    setPageLoading(false);
  }, [initialProducts, initialPagination]);

  useEffect(() => {
    setSelectedCategory(getValidatedCategory());
    setSelectedStatus(getValidatedStatus());
  }, [searchParams]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const navigateToPage = (page: number) => {
    try {
      if (
        !Number.isInteger(page) ||
        page < 1 ||
        page > pagination.totalPages ||
        page > 10000
      ) {
        toast({
          title: "Nieprawidłowy numer strony",
          variant: "destructive",
        });
        return;
      }

      setPageLoading(true);
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", page.toString());
      router.push(`/admin/produkty?${params.toString()}`);
    } catch (error) {
      console.error("Error navigating to page:", error);
      toast({
        title: "Błąd podczas nawigacji",
        variant: "destructive",
      });
      setPageLoading(false);
    }
  };

  const getPageHref = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    return `/admin/produkty?${params.toString()}`;
  };

  const handleSearchSubmit = () => {
    const sanitized = sanitizeSearchInput(searchTerm);
    if (sanitized.length > 0) {
      handleFilterChange(() => updateURL({ search: sanitized || null }));
    } else {
      handleFilterChange(() => updateURL({ search: null }));
    }
  };

  const updateURL = (updates: Record<string, string | null>) => {
    try {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "all") {
          params.delete(key);
        } else {
          if (key === "search") {
            const safeValue =
              String(value).length > 1000
                ? String(value).substring(0, 1000)
                : String(value);
            params.set(key, safeValue);
          } else {
            params.set(key, String(value));
          }
        }
      });

      params.delete("page");

      const newUrl = `/admin/produkty?${params.toString()}`;
      router.push(newUrl);
    } catch (error) {
      console.error("Error updating URL:", error);
      toast({
        title: "Błąd podczas aktualizacji filtrów",
        variant: "destructive",
      });
      setFilterLoading(false);
    }
  };

  const filteredProducts = products;

  const handleFilterChange = useCallback(
    (filterFn: () => void) => {
      if (!canPerformFilter()) {
        toast({
          title: "Zbyt wiele operacji filtrowania",
          description: "Poczekaj chwilę przed ponowną próbą",
          variant: "destructive",
        });
        return;
      }

      setFilterLoading(true);
      try {
        filterFn();
      } catch (error) {
        console.error("Error in filter change:", error);
        setFilterLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    if (filterLoading) {
      const timeoutId = setTimeout(() => {
        console.warn("Filter loading state was stuck, resetting...");
        setFilterLoading(false);
      }, 5000);

      return () => clearTimeout(timeoutId);
    }
  }, [filterLoading]);

  const handlePaginationAfterDelete = useCallback(
    (deletedProductId: string) => {
      const remainingProducts = products.filter(
        (p) => p.id !== deletedProductId
      );
      const currentPage = pagination.page;
      const itemsPerPage = pagination.limit;
      const totalItemsAfterDelete = pagination.totalCount - 1;
      const totalPagesAfterDelete = Math.ceil(
        totalItemsAfterDelete / itemsPerPage
      );

      if (
        remainingProducts.length === 0 &&
        currentPage > 1 &&
        totalPagesAfterDelete > 0
      ) {
        const newPage = Math.min(currentPage - 1, totalPagesAfterDelete);
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", newPage.toString());
        router.push(`/admin/produkty?${params.toString()}`);
      } else {
        router.refresh();
      }
    },
    [products, pagination, searchParams, router]
  );

  const handleDelete = async (productId: string) => {
    if (
      !productId ||
      typeof productId !== "string" ||
      !/^[a-zA-Z0-9_-]+$/.test(productId) ||
      productId.length > 50 ||
      productId.length < 1
    ) {
      toast({
        title: "Nieprawidłowy identyfikator produktu",
        variant: "destructive",
      });
      return;
    }

    if (!isValidUrlParam(productId)) {
      logSecurityEvent("SUSPICIOUS_DELETE_ATTEMPT", {
        action: "delete_validation_failed",
        inputLength: productId.length,
        validationFailed: true,
      });

      toast({
        title: "Nieprawidłowy identyfikator produktu",
        variant: "destructive",
      });
      return;
    }

    if (!canPerformDelete()) {
      return;
    }

    setDeletingId(productId);

    const originalProducts = [...products];
    const originalPagination = { ...pagination };

    setProducts((prevProducts) =>
      prevProducts.filter((p) => p.id !== productId)
    );

    setPagination((prevPagination) => ({
      ...prevPagination,
      totalCount: prevPagination.totalCount - 1,
    }));

    try {
      const csrfTokenValid = await getCsrfToken();
      if (!csrfTokenValid) {
        return;
      }

      const controller = new AbortController();
      const deleteTimeoutId = setTimeout(() => controller.abort(), 10000);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
        signal: controller.signal,
        headers,
        credentials: "include",
      });

      clearTimeout(deleteTimeoutId);

      if (!response.ok) {
        setProducts(originalProducts);
        setPagination(originalPagination);

        let errorMessage = "An error occurred";
        try {
          const responseText = await response.text();
          if (responseText) {
            errorMessage = extractSafeErrorMessage(responseText);
          }
        } catch {
          errorMessage = "An error occurred";
        }

        if (response.status === 404) {
          toast({
            title: "Produkt nie został znaleziony",
            description: "Produkt mógł zostać już usunięty",
            variant: "destructive",
          });
        } else if (response.status === 403) {
          toast({
            title: "Brak uprawnień",
            description: "Nie masz uprawnień do wykonania tej operacji",
            variant: "destructive",
          });
        } else if (response.status === 429) {
          toast({
            title: "Zbyt wiele operacji",
            description: "Poczekaj chwilę przed ponowną próbą",
            variant: "destructive",
          });
        } else if (response.status >= 500) {
          toast({
            title: "Błąd serwera",
            description: "Spróbuj ponownie za chwilę",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Błąd podczas usuwania",
            description: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.",
            variant: "destructive",
          });
        }
        return;
      }

      toast({ title: "Usunięto produkt", variant: "success" });

      handlePaginationAfterDelete(productId);
    } catch (error) {
      setProducts(originalProducts);
      setPagination(originalPagination);

      console.error("Delete error:", error);

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          toast({
            title: "Przekroczono limit czasu",
            description: "Operacja trwała zbyt długo. Spróbuj ponownie.",
            variant: "destructive",
          });
        } else if (error.message.includes("fetch")) {
          toast({
            title: "Brak połączenia z serwerem",
            description: "Sprawdź połączenie internetowe i spróbuj ponownie",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Wystąpił błąd podczas usuwania produktu",
            description: "Spróbuj ponownie za chwilę",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Wystąpił nieoczekiwany błąd",
          description: "Spróbuj ponownie za chwilę",
          variant: "destructive",
        });
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleRefresh = () => {
    setFilterLoading(true);
    setSearchTerm("");
    setSelectedCategory(null);
    setSelectedStatus(null);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    router.push(`/admin/produkty?page=1&limit=${pagination.limit}`);
    timeoutRef.current = setTimeout(() => setFilterLoading(false), 2000);
  };

  const clearAllFilters = () => {
    setSelectedCategory(null);
    setSelectedStatus(null);
    handleFilterChange(() => {
      updateURL({ category: null, status: null, template: null });
    });
  };

  const filterPopoverContent = (
    <FilterPopoverFrame
      title="Filtry produktów"
      hasActiveFilters={getActiveFiltersCount() > 0}
      onClear={clearAllFilters}
    >
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Kategoria</label>
        <Select
          key={selectedCategory || "empty"}
          value={selectedCategory || undefined}
          onValueChange={(value) => {
            setSelectedCategory(value);
            handleFilterChange(() => updateURL({ category: value }));
          }}
        >
          <SelectTrigger className="h-10 w-full rounded-lg border-input hover:bg-muted/50 focus:ring-2 focus:ring-ring focus:ring-offset-2">
            <SelectValue placeholder="Wybierz kategorię..." />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.key} value={category.key}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Status</label>
        <Select
          key={selectedStatus || "empty"}
          value={selectedStatus || undefined}
          onValueChange={(value) => {
            setSelectedStatus(value);
            handleFilterChange(() => updateURL({ status: value }));
          }}
        >
          <SelectTrigger className="h-10 w-full rounded-lg border-input hover:bg-muted/50 focus:ring-2 focus:ring-ring focus:ring-offset-2">
            <SelectValue placeholder="Wybierz status..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">Aktywne</SelectItem>
            <SelectItem value="INACTIVE">Nieaktywne</SelectItem>
            <SelectItem value="TEST">Test</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Szablon cenowy
        </label>
        <Select
          key={templateFilter || "empty"}
          value={templateFilter || undefined}
          onValueChange={(value) => {
            handleFilterChange(() => updateURL({ template: value }));
          }}
        >
          <SelectTrigger className="h-10 w-full rounded-lg border-input hover:bg-muted/50 focus:ring-2 focus:ring-ring focus:ring-offset-2">
            <SelectValue placeholder="Wybierz szablon..." />
          </SelectTrigger>
          <SelectContent>
            {Array.from(
              new Set(
                products
                  .map((p) => p.pricingTemplate?.name)
                  .filter((template): template is string => Boolean(template))
              )
            ).map((template) => (
              <SelectItem key={template} value={template}>
                {template}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </FilterPopoverFrame>
  );

  return (
    <TableErrorBoundary>
      <DataTable
        basePath="/admin/produkty"
        searchPlaceholder="Szukaj produktów..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        onSearchSubmit={handleSearchSubmit}
        onRefresh={handleRefresh}
        loading={filterLoading || pageLoading}
        filterBadgeCount={getActiveFiltersCount()}
        filterPopover={filterPopoverContent}
        toolbarRight={
          <Button asChild>
            <Link href="/admin/produkty/nowy-produkt">
              <Plus className="w-4 h-4 md:mr-[2px]" />
              <span className="hidden md:inline">Dodaj produkt</span>
            </Link>
          </Button>
        }
        entityNamePlural="produktów"
        emptyMessage="Brak produktów"
        pagination={pagination}
        onPageChange={navigateToPage}
        getPageHref={getPageHref}
        onLimitChange={(limit) => {
          try {
            if (
              !Number.isInteger(limit) ||
              limit < 1 ||
              limit > 100 ||
              ![5, 10, 20, 50].includes(limit)
            ) {
              toast({
                title: "Nieprawidłowa liczba elementów na stronę",
                variant: "destructive",
              });
              return;
            }
            setPageLoading(true);
            const params = new URLSearchParams(searchParams.toString());
            params.set("limit", String(limit));
            params.delete("page");
            router.push(`/admin/produkty?${params.toString()}`);
          } catch (error) {
            console.error("Error changing limit:", error);
            toast({
              title: "Błąd podczas zmiany liczby elementów",
              variant: "destructive",
            });
            setPageLoading(false);
          }
        }}
        limitOptions={[5, 10, 20, 50]}
      >
        <Table
          className={`flex-1 ${
            filteredProducts.length > 0
              ? "border-b-[0.8px] border-solid border-[#ccc] dark:border-[#333]"
              : ""
          }`}
        >
          <TableHeader>
            <TableRow className="bg-[#f1f1f1] dark:bg-[#2a2a2a] h-14 border-b-0 hover:bg-[#f1f1f1] dark:hover:bg-[#2a2a2a]">
              <TableHead className="font-medium text-[#444] dark:text-[#aaa] rounded-ss-xl text-base tracking-[0] leading-6">
                Wariant
              </TableHead>
              <TableHead className="font-medium text-[#444] dark:text-[#aaa] text-base tracking-[0] leading-6">
                Kategoria
              </TableHead>
              <TableHead className="font-medium text-[#444] dark:text-[#aaa] text-base tracking-[0] leading-6 text-right">
                Cennik
              </TableHead>
              <TableHead className="font-medium text-[#444] dark:text-[#aaa] text-base tracking-[0] leading-6 text-right">
                Status
              </TableHead>
              <TableHead className="font-medium text-[#444] dark:text-[#aaa] rounded-se-xl text-base tracking-[0] leading-6 text-center">
                Akcje
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-[150px] text-center rounded-b-2xl text-gray-500"
                >
                  Brak produktów
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow
                  key={product.id}
                  className="h-[76px] border-b-[0.8px] border-solid border-[#ccc] dark:border-[#333]"
                >
                  <TableCell>
                    <div className="text-[#444] text-base dark:text-[#c6c6c6] font-medium">
                      {safeTruncateText(product.variant || "")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-[#444] dark:text-[#c6c6c6] font-normal">
                      {getCategoryLabel(product.category)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {product.pricingTemplate?.name ? (
                      <Badge
                        className={`rounded-[26843500px] whitespace-nowrap text-[#555] dark:text-[#aaa] bg-[#eee] dark:bg-[#333] hover:bg-[#ddd] cursor-pointer h-[25px] px-3 font-medium text-sm`}
                      >
                        {safeTruncateText(product.pricingTemplate.name || "")}
                      </Badge>
                    ) : (
                      <Badge
                        className={`rounded-[26843500px] dark:bg-[#333] cursor-pointer h-[25px] px-3 font-medium text-sm bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-100`}
                      >
                        Brak
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      className={`rounded-[26843500px] h-[25px] px-3 font-medium text-sm ${
                        product.status === "ACTIVE"
                          ? "bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-300 hover:bg-green-100"
                          : product.status === "INACTIVE"
                          ? "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-100"
                          : "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-100"
                      }`}
                    >
                      {product.status === "ACTIVE"
                        ? "Aktywny"
                        : product.status === "INACTIVE"
                        ? "Nieaktywny"
                        : "Test"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 bg-gray-100 dark:bg-[#333] rounded-lg hover:bg-gray-200"
                        asChild
                      >
                        <Link href={`/admin/produkty/${product.id}`}>
                          <Edit className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Dialog
                        open={openDeleteIdx === product.id}
                        onOpenChange={(open) => {
                          if (!deletingId) {
                            setOpenDeleteIdx(open ? product.id : null);
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 bg-red-100 dark:bg-red-500/40 rounded-lg hover:bg-red-200"
                            onClick={() => setOpenDeleteIdx(product.id)}
                            disabled={deletingId !== null}
                          >
                            {deletingId === product.id ? (
                              <Loader2 className="animate-spin w-5 h-5" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              Czy na pewno chcesz usunąć ten produkt?
                            </DialogTitle>
                            <DialogDescription>
                              Wszystkie dane tego produktu zostaną usunięte. Ta
                              operacja jest nieodwracalna.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button
                              variant="destructive"
                              disabled={
                                deletingId === product.id || deletingId !== null
                              }
                              onClick={async () => {
                                await handleDelete(product.id);
                                setOpenDeleteIdx(null);
                              }}
                            >
                              {deletingId === product.id ? (
                                <>
                                  <Loader2 className="animate-spin w-4 h-4 mr-2" />
                                  Usuwanie...
                                </>
                              ) : (
                                "Usuń"
                              )}
                            </Button>
                            <Button
                              onClick={() => setOpenDeleteIdx(null)}
                              disabled={deletingId === product.id}
                            >
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
    </TableErrorBoundary>
  );
}
