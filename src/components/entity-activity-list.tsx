"use client";

import type { AdminActivity } from "@/data/admin-activity";

type Props = {
  title: string;
  subtitle: string;
  activities: AdminActivity[];
  activityReady: boolean;
  emptyMessage: string;
};

export function EntityActivityList({
  title,
  subtitle,
  activities,
  activityReady,
  emptyMessage,
}: Props) {
  if (!activityReady) {
    return (
      <section className="rounded-[1.5rem] border border-[#eed8c4] bg-[#fff7ef] px-5 py-5 text-sm leading-7 text-[#7c624b]">
        El historial detallado ya esta preparado, pero falta la tabla de actividad en Supabase.
      </section>
    );
  }

  return (
    <section className="rounded-[1.5rem] border border-[#ece4da] bg-[#fcf8f3] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-[#9f6b44]">
            {title}
          </p>
          <p className="mt-2 text-sm text-[#6a7379]">{subtitle}</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs text-[#7a838a]">
          {activities.length}
        </span>
      </div>

      {activities.length === 0 ? (
        <p className="mt-4 text-sm leading-7 text-[#6a7379]">{emptyMessage}</p>
      ) : (
        <div className="mt-4 space-y-3">
          {activities.map((activity) => (
            <article
              key={activity.id}
              className="rounded-[1.2rem] border border-[#eadfce] bg-white px-4 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#9f6b44]">
                    {activity.action}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[#46535d]">
                    {activity.summary}
                  </p>
                </div>
                <div className="text-right text-xs text-[#8b969d]">
                  <p>{activity.createdAt}</p>
                  <p className="mt-1">{activity.actorEmail}</p>
                  {activity.actorRole ? <p className="mt-1">Rol {activity.actorRole}</p> : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
