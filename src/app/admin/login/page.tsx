import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin-login-form";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const session = await getAdminSession();

  if (session) {
    redirect("/admin");
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-[#f5efe8] px-6 py-12">
      <div className="w-full max-w-md rounded-[2rem] border border-white/80 bg-white p-8 shadow-[0_24px_60px_rgba(35,43,50,0.07)]">
        <p className="text-sm uppercase tracking-[0.35em] text-[#9f6b44]">
          Acceso privado
        </p>
        <h1 className="mt-4 font-serif-display text-5xl text-[#22313b]">
          Panel admin
        </h1>
        <p className="mt-4 text-base leading-8 text-[#5c666d]">
          Ingresa con un usuario autorizado para gestionar propiedades y leads.
        </p>

        <div className="mt-8">
          <AdminLoginForm />
        </div>
      </div>
    </main>
  );
}
