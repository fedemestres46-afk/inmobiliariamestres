import { AdminActivityFeed } from "@/components/admin-activity-feed";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { AdminCrmDashboard } from "@/components/admin-crm-dashboard";
import { canManageContent, formatAdminRoleLabel } from "@/lib/admin-access";
import { getRecentAdminActivity } from "@/lib/activity";
import { requireAdminAccess } from "@/lib/auth";
import { getLeads } from "@/lib/leads";
import { getProperties } from "@/lib/properties";
import { isSupabaseAdminConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await requireAdminAccess();
  const properties = await getProperties();
  const { leads, ready } = await getLeads();
  const { activities, ready: activityReady } = await getRecentAdminActivity();
  const canEdit = isSupabaseAdminConfigured() && canManageContent(session.role);
  const readOnlyReason = !isSupabaseAdminConfigured()
    ? "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor. Con eso habilitamos guardado, subida de imagenes y edicion real."
    : "Tu usuario tiene acceso de solo lectura. Para editar contenido, asignale un rol owner, admin o editor.";

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
            <p className="mt-3 text-sm text-[#6a7379]">
              Sesion activa: {session.email} · Rol {formatAdminRoleLabel(session.role)}
            </p>
          </div>
          <AdminLogoutButton />
        </header>

        <AdminCrmDashboard
          initialProperties={properties}
          initialLeads={leads}
          canPersist={canEdit}
          crmReady={ready}
          readOnlyReason={canEdit ? undefined : readOnlyReason}
          initialActivities={activities}
          activityReady={activityReady}
        />

        <AdminActivityFeed
          initialActivities={activities}
          activityReady={activityReady}
        />
      </div>
    </main>
  );
}
