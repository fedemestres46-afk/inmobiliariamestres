"use client";

import type { AdminActivity } from "@/data/admin-activity";

type Props = {
  initialActivities: AdminActivity[];
  activityReady: boolean;
};

function getEntityLabel(activity: AdminActivity) {
  return activity.entityType === "property" ? "Propiedad" : "Lead";
}

export function AdminActivityFeed({ initialActivities, activityReady }: Props) {
  if (!activityReady) {
    return (
      <section className="mt-10 rounded-[2rem] border border-[#eed8c4] bg-[#fff7ef] px-6 py-6 text-sm leading-7 text-[#7c624b]">
        La actividad del admin esta lista, pero falta crear la tabla `admin_activity_log`
        en Supabase para guardar el historial real de cambios.
      </section>
    );
  }

  if (initialActivities.length === 0) {
    return (
      <section className="mt-10 rounded-[2rem] border border-white/80 bg-white px-6 py-8 text-sm text-[#6a7379] shadow-[0_24px_60px_rgba(35,43,50,0.07)]">
        Todavia no hay actividad registrada. Cuando alguien cree, edite o borre
        contenido desde el panel, va a aparecer aca.
      </section>
    );
  }

  return (
    <section className="mt-10 rounded-[2rem] border border-white/80 bg-white shadow-[0_24px_60px_rgba(35,43,50,0.07)]">
      <div className="border-b border-[#ece4da] px-6 py-5">
        <p className="text-sm uppercase tracking-[0.2em] text-[#7a838a]">
          Actividad
        </p>
        <p className="mt-1 text-sm text-[#6a7379]">
          Historial reciente de cambios reales en propiedades y leads.
        </p>
      </div>

      <div className="divide-y divide-[#ece4da]">
        {initialActivities.map((activity) => (
          <article key={activity.id} className="px-6 py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-[#9f6b44]">
                  {getEntityLabel(activity)} · {activity.action}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-[#22313b]">
                  {activity.entityLabel}
                </h3>
                <p className="mt-2 text-sm leading-7 text-[#5c666d]">
                  {activity.summary}
                </p>
              </div>

              <div className="text-right text-sm text-[#7a838a]">
                <p>{activity.createdAt}</p>
                <p className="mt-1">{activity.actorEmail}</p>
                {activity.actorRole ? <p className="mt-1">Rol {activity.actorRole}</p> : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
