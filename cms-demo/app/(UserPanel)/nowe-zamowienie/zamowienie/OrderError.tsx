"use client";

import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function OrderError() {
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    toast({
      variant: "destructive",
      title: "Wystąpił błąd",
      description:
        "Przepraszamy, wystąpił nieoczekiwany błąd. Zostaniesz przekierowany na stronę główną.",
    });

    setTimeout(() => {
      router.push("/");
    }, 2000);
  }, [toast, router]);

  return null; 
}
