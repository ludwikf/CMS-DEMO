"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ButtonLoading } from "./components/ButtonLoading";
import { Eye, EyeOff } from "lucide-react";
import { ModeToggle } from "./components/ModeToggle";
import { APP_NAME } from "@/lib/branding";

const FormSchema = z.object({
  email: z.string().min(1, { message: "Podaj e-mail" }),
  password: z.string().min(1, { message: "Podaj hasło" }),
});

export default function LoginForm() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    localStorage.removeItem("expireTime");
    setLoading(true);
    setErrorMessage(null);
    try {
      const signInData = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (!signInData) {
        setLoading(false);
        toast({
          variant: "destructive",
          title: "Błąd połączenia",
          description:
            "Wystąpił niespodziewany błąd. Sprawdź połączenie z siecią i spróbuj ponownie.",
        });
        return;
      }

      if (signInData.error === "CredentialsSignin") {
        setLoading(false);
        setErrorMessage("Nieprawidłowy e-mail lub hasło");
        return;
      }

      if (
        signInData?.error ||
        (signInData?.status && signInData.status >= 500)
      ) {
        setLoading(false);
        toast({
          variant: "destructive",
          title: "Błąd serwera",
          description:
            "Wystąpił problem z serwerem lub połączeniem. Spróbuj ponownie później.",
        });
        return;
      }

      setLoading(false);
      router.push("/nowe-zamowienie");
    } catch {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Błąd połączenia",
        description:
          "Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe i spróbuj ponownie.",
      });
    }
  }

  useEffect(() => {
    const storedLogout = localStorage.getItem("innactiveLogout");
    if (storedLogout) {
      toast({
        description: "Sesja wygasła, zaloguj się ponownie",
        variant: "destructive",
      });
      localStorage.removeItem("innactiveLogout");
    }
    localStorage.removeItem("expireTime");
  }, [toast]);

  return (
    <div className="w-screen mobile-safe-height flex justify-center items-center overflow-hidden">
      <div className="absolute left-3 sm:left-5 top-3 sm:top-5 font-semibold text-base sm:text-lg text-[#1E293B] dark:text-white hidden lg:block">
        {APP_NAME} — demo
      </div>

      <div className="absolute right-5 top-5">
        <ModeToggle />
      </div>

      <div className="px-8 py-3 sm:px-8 sm:py-5 lg:px-14 lg:py-9 rounded-[12px] sm:rounded-[16px] shadow-2xl flex flex-col items-center w-full h-full justify-center sm:h-auto sm:max-w-[400px] md:max-w-[450px] sm:bg-white sm:dark:bg-[#333] dark:text-white">
        <div className="flex flex-col items-center"><div className="font-bold text-xl sm:text-2xl mt-3 sm:mt-4 mb-1 dark:text-white">
            Witaj ponownie
          </div>
          <p className="text-xs sm:text-sm text-center text-[#64748B] dark:text-[#999]">
            Zaloguj się, aby przejść do wersji demonstracyjnej
          </p>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full flex flex-col gap-4 sm:gap-5 mt-4 sm:mt-5"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-[15px] dark:text-white">
                    E-mail
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Wprowadź e-mail"
                      className="text-sm sm:text-md h-[36px] sm:h-[40px] dark:bg-[#444] dark:border-[#555] dark:text-white"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        setErrorMessage(null);
                      }}
                    />
                  </FormControl>
                  <FormMessage className="text-xs sm:text-sm" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-[15px] dark:text-white">
                    Hasło
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="Wprowadź hasło"
                        type={showPassword ? "text" : "password"}
                        className="text-sm sm:text-md h-[36px] sm:h-[40px] pr-10 dark:bg-[#444] dark:border-[#555] dark:text-white"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setErrorMessage(null);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs sm:text-sm" />
                </FormItem>
              )}
            />

            {errorMessage && (
              <p className="text-red-500 text-xs sm:text-sm">{errorMessage}</p>
            )}

            {loading ? (
              <ButtonLoading className="bg-mainTheme text-white h-[40px]" />
            ) : (
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-mainTheme hover:bg-mainTheme/90 text-white h-[40px]"
              >
                Zaloguj się
              </Button>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
}

