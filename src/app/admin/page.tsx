import { AdminLogoutButton } from "@/components/admin-logout-button";
import { AdminCrmDashboard } from "@/components/admin-crm-dashboard";
import { requireAdminSession } from "@/lib/auth";
import { getLeads } from "@/lib/leads";
import { getProperties } from "@/lib/properties";
import { isSupabaseAdminConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdminSession();
  const properties = await getProperties();
  const { leads, ready } = await getLeads();

  return (
    <main className="flex-1 bg-[#f5efe8] px-6 py-10 text-[#1e2930] md:px-10 lg:px-14">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-[#9f6b44]">
              Panel de administracion
            </p>
            <h1 className="mt-3 font-serif-display text-5xl">
              Gestion de propiedades
            </h1>
          </div>
          <AdminLogoutButton />
        </header>

        <AdminCrmDashboard
          initialProperties={properties}
          initialLeads={leads}
          canPersist={isSupabaseAdminConfigured()}
          crmReady={ready}
        />
      </div>
    </main>
  );
}
