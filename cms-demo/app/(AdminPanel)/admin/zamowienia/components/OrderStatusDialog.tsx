"use client";

import { ButtonLoading } from "@/app/components/ButtonLoading";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

type StatusKey =
  | "unconfirmed"
  | "confirmed"
  | "inProgress"
  | "delivery"
  | "pickup"
  | "finished"
  | "cancelled";

const STATUS_LABELS: Record<StatusKey, string> = {
  unconfirmed: "Niepotwierdzone",
  confirmed: "Potwierdzone",
  inProgress: "W trakcie realizacji",
  delivery: "Wysłane",
  pickup: "Do odbioru",
  finished: "Zakończone",
  cancelled: "Anulowane",
};

type PrismaStatus =
  | "UNCONFIRMED"
  | "PENDING"
  | "IN_PROGRESS"
  | "CONFIRMED"
  | "DELIVERED"
  | "CANCELLED"
  | "FINISHED";

function prismaStatusToFrontend(
  status: PrismaStatus,
  shipping?: { method?: string } | null
): StatusKey {
  switch (status) {
    case "UNCONFIRMED":
    case "PENDING":
      return "unconfirmed";
    case "IN_PROGRESS":
      return "inProgress";
    case "CONFIRMED":
      return "confirmed";
    case "DELIVERED":
      return shipping?.method === "pickup" ? "pickup" : "delivery";
    case "CANCELLED":
      return "cancelled";
    case "FINISHED":
      return "finished";
    default:
      return "unconfirmed";
  }
}

const statusFormSchema = z.object({
  status: z.string({ required_error: "Wybierz status z listy" }),
});

export type OrderStatusDialogProps = {
  orderId: string;

  prismaStatus?: PrismaStatus;

  frontendStatus?: string;

  deliveryMethod?: "delivery" | "pickup";

  shipping?: { method?: string } | null;
  onSuccess?: () => void | Promise<void>;

  open?: boolean;
  onOpenChange?: (open: boolean) => void;

  trigger?: React.ReactNode;
};

export function OrderStatusDialog({
  orderId,
  prismaStatus,
  frontendStatus,
  deliveryMethod = "delivery",
  shipping,
  onSuccess,
  open: controlledOpen,
  onOpenChange,
  trigger,
}: OrderStatusDialogProps) {
  const [loading, setLoading] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const currentFrontendStatus =
    frontendStatus ??
    (prismaStatus
      ? prismaStatusToFrontend(prismaStatus, shipping)
      : "unconfirmed");
  const effectiveDeliveryMethod =
    deliveryMethod === "pickup" ? "pickup" : "delivery";

  const statusOrder: StatusKey[] = [
    "unconfirmed",
    "confirmed",
    "inProgress",
    effectiveDeliveryMethod === "delivery" ? "delivery" : "pickup",
    "finished",
    "cancelled",
  ];

  const form = useForm<z.infer<typeof statusFormSchema>>({
    resolver: zodResolver(statusFormSchema),
    defaultValues: { status: currentFrontendStatus },
  });

  useEffect(() => {
    form.reset({ status: currentFrontendStatus });
  }, [currentFrontendStatus, form]);

  const handleSubmit = async (data: z.infer<typeof statusFormSchema>) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: data.status }),
      });
      if (!res.ok) throw new Error("Błąd zmiany statusu");
      await onSuccess?.();
      setOpen(false);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Zmień status zamówienia</DialogTitle>
        <DialogDescription className="py-3">
          Wybierz nowy status z listy i potwierdź.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-4"
        >
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {statusOrder.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s === "delivery"
                          ? "Wysłane"
                          : s === "pickup"
                          ? "Do odbioru"
                          : STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          {loading ? (
            <ButtonLoading className="w-fit self-end" />
          ) : (
            <Button
              type="submit"
              disabled={currentFrontendStatus === form.watch("status")}
              className="w-fit self-end"
            >
              Zatwierdź
            </Button>
          )}
        </form>
      </Form>
    </DialogContent>
  );

  if (trigger !== undefined) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        {content}
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {content}
    </Dialog>
  );
}
