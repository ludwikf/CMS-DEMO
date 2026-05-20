"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

interface ProductFormErrorProps {
  error?: Error;
  resetError: () => void;
}

export default function ProductFormError({
  error,
  resetError,
}: ProductFormErrorProps) {
  const router = useRouter();

  return (
    <Card className="w-full max-w-lg mx-auto mt-8">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20">
          <FileText className="h-6 w-6 text-red-500 dark:text-red-400" />
        </div>
        <CardTitle className="text-xl text-red-500 dark:text-red-400">
          Błąd formularza produktu
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-center text-gray-600 dark:text-gray-300">
          Nie udało się załadować formularza produktu. Sprawdź połączenie i
          spróbuj ponownie.
        </p>

        <div className="flex flex-col gap-2">
          <Button onClick={resetError} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Spróbuj ponownie
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push("/admin/produkty")}
            className="w-full"
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Wróć do listy produktów
          </Button>
        </div>

        {process.env.NODE_ENV === "development" && error && (
          <details className="mt-4 p-3 bg-red-200 dark:bg-red-500/40 rounded text-xs">
            <summary className="cursor-pointer font-medium">
              Szczegóły błędu (dev)
            </summary>
            <pre className="mt-2 whitespace-pre-wrap">{error.message}</pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
