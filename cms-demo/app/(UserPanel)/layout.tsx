import { getServerSession } from "next-auth";
import Navbar from "../components/Navbar";
import NextTopLoader from "nextjs-toploader";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import NavbarMobile from "../components/NavbarMobile";
import { CartProvider } from "@/app/contexts/CartContext";
import Footer from "../components/ConditionalFooter";

export default async function Layout({ children }: React.PropsWithChildren) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  return (
    <CartProvider>
      <NextTopLoader color="#e80050" showSpinner={false} />
      <div className="hidden lg:block">
        <Navbar />
      </div>
      <div className="lg:hidden">
        <NavbarMobile />
      </div>
      <div className="min-h-screen flex flex-col">
        <main className="mt-[60px] lg:mt-[70px] flex-1">{children}</main>
        <Footer />
      </div>
    </CartProvider>
  );
}
