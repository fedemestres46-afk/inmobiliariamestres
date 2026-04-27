import { AdminPropertiesManager } from "@/components/admin-properties-manager";
import { getProperties } from "@/lib/properties";
import { isSupabaseAdminConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const properties = await getProperties();

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
            <p className="mt-4 max-w-2xl text-base leading-8 text-[#5c666d]">
              Esta pantalla queda lista para Supabase Free. Si no hay variables
              cargadas, usa mock data sin romper la app.
            </p>
          </div>
        </header>

        <AdminPropertiesManager
          initialProperties={properties}
          canPersist={isSupabaseAdminConfigured()}
        />

        <section className="mt-8 rounded-[1.5rem] border border-dashed border-[#d7c7b6] bg-[#fbf7f2] px-6 py-5 text-sm leading-7 text-[#6a7379]">
          Recomendacion para el plan gratuito: mantener una sola tabla principal
          de propiedades, usar URLs externas para imagenes mientras arrancamos y
          agregar login admin recien cuando la base ya este conectada.
        </section>
      </div>
    </main>
  );
}
