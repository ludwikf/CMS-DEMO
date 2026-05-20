import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { PRODUCT_INPUT_TYPES } from "@/app/contexts/inputTypes";

interface UseProductSubmissionProps {
  isAddMode: boolean;
  action: string;
  hasSubvariants: boolean;
  subvariantInputsSeparate: boolean;
  subvariants: string[];
  parametersBySubvariant: Record<string, any>;
  getSubKey: () => string;
  form: any;
  setIsSubmitting: (loading: boolean) => void;
}

export const useProductSubmission = ({
  isAddMode,
  action,
  hasSubvariants,
  subvariantInputsSeparate,
  subvariants,
  parametersBySubvariant,
  getSubKey,
  form,
  setIsSubmitting,
}: UseProductSubmissionProps) => {
  const router = useRouter();
  const { toast } = useToast();

  const onSubmit = useCallback(
    async (values: any) => {
      setIsSubmitting(true);
      try {
        const subKey = getSubKey();
        const currentParams = parametersBySubvariant[subKey];

        const transformToApiFormat = (params: any) => {
          const inputs: any[] = [];

          Object.entries(params.inputs).forEach(([type, enabled]) => {
            if (enabled) {
              const input: any = { type };
              const config = PRODUCT_INPUT_TYPES.find((t) => t.id === type);

              if (params.defaultsEnabled[type]) {
                if (config?.type === "number") {
                  const numValue = parseFloat(params.defaults[type]);
                  input.default = isNaN(numValue) ? null : numValue;
                } else {
                  input.default = params.defaults[type] || null;
                }
              }

              if (
                config?.hasValues &&
                params.inputValues[type] &&
                params.inputValues[type].length > 0
              ) {
                if (type === "ACCESSORIES") {
                  input.values = params.inputValues[type]
                    .filter(
                      (v: any) =>
                        v && typeof v === "object" && v.name && v.quantity
                    )
                    .map((v: any) => ({
                      name: v.name,
                      quantity: Number(v.quantity),
                    }));
                } else {
                  input.values = params.inputValues[type];
                }
              }

              if (
                params.required &&
                typeof params.required[type] === "boolean"
              ) {
                input.required = params.required[type];
              } else {
                input.required = config?.hasRequired || false;
              }

              if (type === "HANDLE" && params.handleCustomEnabled) {
                if (
                  Array.isArray(input.values) &&
                  !input.values.includes("__custom__")
                ) {
                  input.values = [...input.values, "__custom__"];
                }
              }
              if (type === "HANDLE" && !params.handleCustomEnabled) {
                if (Array.isArray(input.values)) {
                  input.values = input.values.filter(
                    (v: any) => v !== "__custom__"
                  );
                }
              }

              inputs.push(input);
            }
          });

          return inputs;
        };

        let inputsBySubvariant: Record<string, any[]> = {};

        if (hasSubvariants && subvariantInputsSeparate) {
          subvariants.forEach((subvariant) => {
            const subvariantParams = parametersBySubvariant[subvariant];
            if (subvariantParams) {
              inputsBySubvariant[subvariant] =
                transformToApiFormat(subvariantParams);
            }
          });
        } else if (hasSubvariants && !subvariantInputsSeparate) {
          const mainParams = parametersBySubvariant.main;
          if (mainParams) {
            inputsBySubvariant.main = transformToApiFormat(mainParams);
          }
        } else {
          inputsBySubvariant.main = transformToApiFormat(currentParams);
        }

        const productData = {
          category: values.category,
          variant: values.variant,
          status: values.status,
          pricingTemplateId: values.pricingTemplate || undefined,
          inputsBySubvariant,
          subvariants: hasSubvariants ? subvariants : [],
        };

        const url = isAddMode
          ? "/api/admin/products"
          : `/api/admin/products/${action}`;

        const method = isAddMode ? "POST" : "PUT";

        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(productData),
        });

        if (!response.ok) {
          const error = await response.json();

          if (
            error.error?.includes("already exists") ||
            error.error?.includes("istnieje") ||
            error.error?.includes("duplikat")
          ) {
            form.setError("variant", {
              type: "manual",
              message: "Wariant o tej nazwie już istnieje",
            });
            return;
          }

          if (error.error === "Product validation failed" && error.details) {
            const errorDetails = Array.isArray(error.details)
              ? error.details.join(", ")
              : error.details;

            toast({
              variant: "destructive",
              title: "Błąd walidacji produktu",
              description: errorDetails,
            });
            return;
          }

          if (
            error.error === "Product structure validation failed" &&
            error.details
          ) {
            const errorDetails = Array.isArray(error.details)
              ? error.details.join(", ")
              : error.details;

            toast({
              variant: "destructive",
              title: "Błąd struktury produktu",
              description: errorDetails,
            });
            return;
          }

          toast({
            variant: "destructive",
            title: "Błąd",
            description:
              error.message || "Wystąpił błąd podczas zapisywania produktu.",
          });
        } else {
          toast({
            title: isAddMode
              ? "Produkt został dodany"
              : "Produkt został zaktualizowany",
            variant: "success",
          });
          router.push("/admin/produkty");
          router.refresh();
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Błąd",
          description: error.message || "Coś poszło nie tak",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      isAddMode,
      action,
      hasSubvariants,
      subvariantInputsSeparate,
      subvariants,
      parametersBySubvariant,
      getSubKey,
      form,
      setIsSubmitting,
      router,
      toast,
    ]
  );

  return { onSubmit };
};
