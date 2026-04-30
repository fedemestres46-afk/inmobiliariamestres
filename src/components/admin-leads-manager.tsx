"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { EntityActivityList } from "@/components/entity-activity-list";
import type { AdminActivity } from "@/data/admin-activity";
import type { Lead, LeadStatus } from "@/data/leads";

type Props = {
  initialLeads: Lead[];
  crmReady: boolean;
  canEdit: boolean;
  readOnlyReason?: string;
  initialActivities: AdminActivity[];
  activityReady: boolean;
};

type SaveState = {
  type: "idle" | "success" | "error";
  message: string;
};

type ExportState = {
  type: "idle" | "success" | "error";
  message: string;
};

const statusOptions: LeadStatus[] = [
  "Nuevo",
  "Contactado",
  "Visita",
  "Negociacion",
  "Cerrado",
  "Descartado",
];

const boardColumns: Array<{
  title: string;
  statuses: LeadStatus[];
  accent: string;
  border: string;
  bg: string;
}> = [
  {
    title: "Nuevos",
    statuses: ["Nuevo"],
    accent: "text-[#9f6b44]",
    border: "border-[#edd8b8]",
    bg: "bg-[#fff8ef]",
  },
  {
    title: "Contactados",
    statuses: ["Contactado"],
    accent: "text-[#2f617b]",
    border: "border-[#c8deea]",
    bg: "bg-[#f1f8fc]",
  },
  {
    title: "Visitas",
    statuses: ["Visita"],
    accent: "text-[#486e8d]",
    border: "border-[#d7e4ee]",
    bg: "bg-[#f5fafd]",
  },
  {
    title: "Negociacion",
    statuses: ["Negociacion"],
    accent: "text-[#766a31]",
    border: "border-[#e6dbb4]",
    bg: "bg-[#fffcec]",
  },
  {
    title: "Cerrados",
    statuses: ["Cerrado"],
    accent: "text-[#39704a]",
    border: "border-[#cfe6d6]",
    bg: "bg-[#f3fbf5]",
  },
  {
    title: "Descartados",
    statuses: ["Descartado"],
    accent: "text-[#b04c47]",
    border: "border-[#ebcbc8]",
    bg: "bg-[#fff4f3]",
  },
];

export function AdminLeadsManager({
  initialLeads,
  crmReady,
  canEdit,
  readOnlyReason,
  initialActivities,
  activityReady,
}: Props) {
  const leadsSectionRef = useRef<HTMLElement | null>(null);
  const [leads, setLeads] = useState(initialLeads);
  const [selectedLeadId, setSelectedLeadId] = useState(initialLeads[0]?.id ?? "");
  const [statusFilter, setStatusFilter] = useState<
    LeadStatus | "En curso" | "Todos"
  >("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [saveState, setSaveState] = useState<SaveState>({
    type: "idle",
    message: "",
  });
  const [exportState, setExportState] = useState<ExportState>({
    type: "idle",
    message: "",
  });
  const [isPending, startTransition] = useTransition();
  const [isExporting, setIsExporting] = useState(false);
  const isMutating = isPending || isExporting;

  const searchFilteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        query === ""
          ? true
          : [
              lead.fullName,
              lead.phone,
              lead.email,
              lead.propertyTitle,
              lead.propertyLocation,
            ]
              .filter(Boolean)
              .some((value) => String(value).toLowerCase().includes(query));

      return matchesQuery;
    });
  }, [leads, searchQuery]);

  const filteredLeads = useMemo(() => {
    return searchFilteredLeads.filter((lead) => {
      return statusFilter === "Todos"
        ? true
        : statusFilter === "En curso"
          ? ["Contactado", "Visita", "Negociacion"].includes(lead.status)
          : lead.status === statusFilter;
    });
  }, [searchFilteredLeads, statusFilter]);

  const selectedLead =
    filteredLeads.find((lead) => lead.id === selectedLeadId) ?? filteredLeads[0];

  const selectedLeadActivities = useMemo(() => {
    if (!selectedLead) {
      return [];
    }

    return initialActivities
      .filter(
        (activity) =>
          activity.entityType === "lead" && activity.entityId === selectedLead.id,
      )
      .slice(0, 6);
  }, [initialActivities, selectedLead]);

  const totals = useMemo(
    () => ({
      nuevos: leads.filter((lead) => lead.status === "Nuevo").length,
      enCurso: leads.filter((lead) =>
        ["Contactado", "Visita", "Negociacion"].includes(lead.status),
      ).length,
      cerrados: leads.filter((lead) => lead.status === "Cerrado").length,
    }),
    [leads],
  );

  const boardLeads = useMemo(
    () =>
      boardColumns.map((column) => ({
        ...column,
        leads: searchFilteredLeads.filter((lead) =>
          column.statuses.includes(lead.status),
        ),
      })),
    [searchFilteredLeads],
  );

  useEffect(() => {
    setSelectedLeadId((currentId) => {
      if (filteredLeads.length === 0) {
        return "";
      }

      if (currentId && filteredLeads.some((lead) => lead.id === currentId)) {
        return currentId;
      }

      return filteredLeads[0]?.id ?? "";
    });
  }, [filteredLeads]);

  function getWhatsAppHref(lead: Lead) {
    const sanitizedPhone = lead.phone.replace(/[^\d]/g, "");
    const internationalPhone = sanitizedPhone.startsWith("54")
      ? sanitizedPhone
      : `54${sanitizedPhone}`;

    return `https://wa.me/${internationalPhone}?text=${encodeURIComponent(
      `Hola ${lead.fullName}, te escribo por tu consulta sobre ${lead.propertyTitle}.`,
    )}`;
  }

  function focusLeadStage(status: LeadStatus, leadId?: string) {
    const stageLeadId =
      leadId ?? searchFilteredLeads.find((currentLead) => currentLead.status === status)?.id;

    setStatusFilter(status);
    setSaveState({ type: "idle", message: "" });

    if (stageLeadId) {
      setSelectedLeadId(stageLeadId);
    }

    window.setTimeout(() => {
      leadsSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  }

  async function handleSubmit(formData: FormData) {
    if (!selectedLead || !crmReady || !canEdit || isMutating) {
      return;
    }

    const nextStatus = String(formData.get("status") ?? "Nuevo") as LeadStatus;

    if (
      selectedLead.status !== nextStatus &&
      ["Cerrado", "Descartado"].includes(nextStatus) &&
      !window.confirm(
        `El lead de ${selectedLead.fullName} pasara a ${nextStatus.toLowerCase()}. Quieres continuar?`,
      )
    ) {
      return;
    }

    const payload = {
      status: nextStatus,
      notes: String(formData.get("notes") ?? ""),
      scheduledAt: String(formData.get("scheduled_at") ?? ""),
    };

    startTransition(async () => {
      const response = await fetch(`/api/admin/leads/${selectedLead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as
        | { lead?: Lead; error?: string }
        | undefined;

      if (!response.ok || !result?.lead) {
        setSaveState({
          type: "error",
          message: result?.error ?? "No se pudo actualizar el lead.",
        });
        return;
      }

      setLeads((current) =>
        current.map((lead) => (lead.id === result.lead?.id ? result.lead : lead)),
      );
      setSaveState({
        type: "success",
        message: "Lead actualizado correctamente.",
      });
    });
  }

  async function handleExportLeads() {
    if (!crmReady || !canEdit || isMutating || leads.length === 0) {
      return;
    }

    setIsExporting(true);
    setExportState({ type: "idle", message: "" });

    try {
      const response = await fetch("/api/admin/leads/export", {
        method: "POST",
      });

      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        setExportState({
          type: "error",
          message: result.error ?? "No se pudieron exportar los leads.",
        });
        return;
      }

      const blob = await response.blob();
      const fileName =
        response.headers
          .get("Content-Disposition")
          ?.match(/filename="([^"]+)"/)?.[1] ?? "leads.xlsx";
      const exportedCount = Number(response.headers.get("X-Exported-Count") ?? "0");

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setExportState({
        type: "success",
        message: `Se exportaron ${exportedCount} lead(s) a Excel.`,
      });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <>
      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          {
            label: "Nuevos",
            value: totals.nuevos,
            filter: "Nuevo" as LeadStatus,
            accent: "text-[#9f6b44]",
            active: "bg-[#fff8ef] border-[#edd8b8]",
          },
          {
            label: "En curso",
            value: totals.enCurso,
            filter: "En curso" as const,
            accent: "text-[#2f617b]",
            active: "bg-[#f1f8fc] border-[#c8deea]",
          },
          {
            label: "Cerrados",
            value: totals.cerrados,
            filter: "Cerrado" as LeadStatus,
            accent: "text-[#39704a]",
            active: "bg-[#f3fbf5] border-[#cfe6d6]",
          },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() =>
              setStatusFilter((current) =>
                current === item.filter ? "Todos" : item.filter,
              )
            }
            className={`rounded-[1.5rem] border px-6 py-5 text-left shadow-[0_18px_40px_rgba(35,43,50,0.06)] transition ${
              statusFilter === item.filter
                ? item.active
                : "border-white/80 bg-white hover:bg-[#faf6f0]"
            }`}
          >
            <p className={`text-sm uppercase tracking-[0.3em] ${item.accent}`}>
              {item.label}
            </p>
            <p className="mt-4 font-serif-display text-4xl">{item.value}</p>
          </button>
        ))}
      </section>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Buscar por nombre, telefono, email o propiedad"
          className="w-full rounded-full border border-[#e7ddd2] bg-white px-5 py-3 outline-none transition focus:border-[#9f6b44]"
        />
        {statusFilter !== "Todos" || searchQuery.trim() !== "" ? (
          <button
            type="button"
            onClick={() => {
              setStatusFilter("Todos");
              setSearchQuery("");
            }}
            className="rounded-full border border-[#d8cabd] bg-white px-5 py-3 text-sm font-semibold text-[#5c666d] transition hover:bg-[#f7efe5]"
          >
            Limpiar filtros
          </button>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#6a7379]">
          {leads.length > 0
            ? `${leads.length} lead(s) listos para exportar.`
            : "Todavia no hay leads para exportar."}
        </p>
        <button
          type="button"
          onClick={() => void handleExportLeads()}
          disabled={!crmReady || !canEdit || isMutating || leads.length === 0}
          className="rounded-full border border-[#d8cabd] bg-white px-5 py-3 text-sm font-semibold text-[#1f3b4d] transition hover:bg-[#f7efe5] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isExporting ? "Exportando..." : "Exportar todo"}
        </button>
      </div>

      {exportState.message ? (
        <p
          className={`mt-3 text-sm ${
            exportState.type === "error" ? "text-[#a04d39]" : "text-[#39704a]"
          }`}
        >
          {exportState.message}
        </p>
      ) : null}

      {!crmReady ? (
        <section className="mt-8 rounded-[1.5rem] border border-[#eed8c4] bg-[#fff7ef] px-6 py-5 text-sm leading-7 text-[#7c624b]">
          La vista CRM ya esta lista, pero falta crear la tabla `leads` en
          Supabase para guardar consultas reales desde la web.
        </section>
      ) : null}

      {crmReady && !canEdit ? (
        <section className="mt-8 rounded-[1.5rem] border border-[#d9dfe3] bg-[#f7fafc] px-6 py-5 text-sm leading-7 text-[#5f6b73]">
          {readOnlyReason ??
            "Tu usuario tiene acceso de solo lectura en el CRM. Puedes revisar leads, pero no editar estados ni notas."}
        </section>
      ) : null}

      <section className="mt-8 space-y-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-[#9f6b44]">
            Pipeline
          </p>
          <h2 className="mt-3 font-serif-display text-4xl text-[#22313b]">
            Vista rapida del seguimiento
          </h2>
        </div>

        <div className="grid gap-4 xl:grid-cols-6">
          {boardLeads.map((column) => (
            <article
              key={column.title}
              role="button"
              tabIndex={0}
              aria-disabled={isMutating}
              onClick={() => focusLeadStage(column.statuses[0], column.leads[0]?.id)}
              onKeyDown={(event) => {
                if (isMutating) {
                  return;
                }
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  focusLeadStage(column.statuses[0], column.leads[0]?.id);
                }
              }}
              style={isMutating ? { pointerEvents: "none", opacity: 0.7 } : undefined}
              className={`cursor-pointer rounded-[1.5rem] border p-4 shadow-[0_18px_40px_rgba(35,43,50,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(35,43,50,0.08)] ${column.border} ${column.bg}`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className={`text-sm uppercase tracking-[0.22em] ${column.accent}`}>
                  {column.title}
                </p>
                <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs text-[#5c666d]">
                  {column.leads.length}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {column.leads.slice(0, 2).map((lead) => (
                  <div
                    key={lead.id}
                    className={`w-full rounded-[1.2rem] border bg-white px-3 py-3 text-left transition ${
                      lead.id === selectedLead?.id
                        ? "border-[#9f6b44] shadow-[0_12px_24px_rgba(159,107,68,0.12)]"
                        : "border-white/80 hover:border-[#d8cabd]"
                    }`}
                  >
                    <p className="text-sm font-semibold text-[#22313b]">
                      {lead.fullName}
                    </p>
                    <p className="mt-1 text-xs text-[#6a7379]">
                      {lead.propertyTitle}
                    </p>
                  </div>
                ))}

                {column.leads.length === 0 ? (
                  <div className="rounded-[1.2rem] border border-dashed border-white/80 px-3 py-4 text-xs text-[#7a838a]">
                    Sin leads en esta etapa.
                  </div>
                ) : null}

                {column.leads.length > 2 ? (
                  <div className="w-full rounded-[1.2rem] border border-dashed border-white/80 px-3 py-3 text-center text-lg font-semibold text-[#7a838a] transition hover:border-[#d8cabd] hover:bg-white/70">
                    +{column.leads.length - 2}
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        ref={leadsSectionRef}
        className="mt-10 grid gap-8 xl:grid-cols-[1.08fr_0.92fr]"
      >
        <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_24px_60px_rgba(35,43,50,0.07)]">
          <div className="border-b border-[#ece4da] px-6 py-5">
            <p className="text-sm uppercase tracking-[0.2em] text-[#7a838a]">
              Leads
            </p>
            <p className="mt-1 text-sm text-[#6a7379]">
              Consultas asociadas a propiedades y listas para seguimiento.
            </p>
          </div>

          <div className="divide-y divide-[#ece4da]">
            {filteredLeads.map((lead) => (
              <button
                key={lead.id}
                type="button"
                onClick={() => {
                  if (isMutating) {
                    return;
                  }
                  setSelectedLeadId(lead.id);
                  setSaveState({ type: "idle", message: "" });
                }}
                disabled={isMutating}
                className={`w-full px-6 py-5 text-left transition ${
                  lead.id === selectedLead?.id ? "bg-[#fcf8f3]" : "hover:bg-[#faf6f0]"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-[#22313b]">
                      {lead.fullName}
                    </h2>
                    <p className="mt-1 text-sm text-[#667178]">
                      {lead.propertyTitle}
                    </p>
                    {lead.scheduledAt ? (
                      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[#8b969d]">
                        Visita: {lead.scheduledAt}
                      </p>
                    ) : null}
                    <p className="mt-2 text-sm text-[#7a838a]">
                      {lead.phone}
                      {lead.email ? ` · ${lead.email}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="rounded-full bg-[#f2e5d8] px-3 py-1 text-sm text-[#8a5a38]">
                      {lead.status}
                    </span>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#8b969d]">
                      {lead.origin}
                    </p>
                    <p className="mt-1 text-xs text-[#8b969d]">{lead.createdAt}</p>
                  </div>
                </div>
              </button>
            ))}

            {leads.length === 0 ? (
              <div className="px-6 py-8 text-sm text-[#6a7379]">
                Todavia no entraron consultas. Cuando alguien complete un
                formulario desde la web, va a aparecer aca.
              </div>
            ) : null}
            {leads.length > 0 && filteredLeads.length === 0 ? (
              <div className="px-6 py-8 text-sm text-[#6a7379]">
                No hay leads que coincidan con los filtros actuales.
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_24px_60px_rgba(35,43,50,0.07)]">
          {!selectedLead ? (
            <div className="flex min-h-[24rem] flex-col items-center justify-center text-center">
              <p className="text-sm uppercase tracking-[0.3em] text-[#9f6b44]">
                Sin leads
              </p>
              <h2 className="mt-4 font-serif-display text-4xl text-[#22313b]">
                Aun no hay consultas para gestionar
              </h2>
            </div>
          ) : (
            <form key={selectedLead.id} action={handleSubmit}>
              <fieldset disabled={isMutating || !crmReady || !canEdit} className="contents">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-[#9f6b44]">
                    Lead
                  </p>
                  <h2 className="mt-3 font-serif-display text-4xl text-[#22313b]">
                    {selectedLead.fullName}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-[#5c666d]">
                    Consulta por <strong>{selectedLead.propertyTitle}</strong>
                    {selectedLead.propertyLocation
                      ? ` · ${selectedLead.propertyLocation}`
                      : ""}
                  </p>
                </div>
                <span className="rounded-full bg-[#f5efe8] px-3 py-1 text-sm text-[#76573b]">
                  {selectedLead.status}
                </span>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.5rem] border border-[#ece4da] px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#8b969d]">
                    Telefono
                  </p>
                  <p className="mt-2 text-lg text-[#22313b]">{selectedLead.phone}</p>
                  <a
                    href={getWhatsAppHref(selectedLead)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex rounded-full border border-[#d8cabd] px-4 py-2 text-sm font-semibold text-[#1f3b4d] transition hover:bg-[#f7efe5]"
                  >
                    Abrir WhatsApp
                  </a>
                </div>
                <div className="rounded-[1.5rem] border border-[#ece4da] px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#8b969d]">
                    Email
                  </p>
                  <p className="mt-2 text-lg text-[#22313b]">
                    {selectedLead.email ?? "No informo"}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.5rem] border border-[#ece4da] px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#8b969d]">
                    Ingreso
                  </p>
                  <p className="mt-2 text-lg text-[#22313b]">
                    {selectedLead.createdAt}
                  </p>
                  {selectedLead.updatedAt ? (
                    <p className="mt-2 text-xs text-[#8b969d]">
                      Ultima edicion: {selectedLead.updatedAt}
                      {selectedLead.lastEditedByEmail
                        ? ` · ${selectedLead.lastEditedByEmail}`
                        : ""}
                    </p>
                  ) : null}
                </div>
                <div className="rounded-[1.5rem] border border-[#ece4da] px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#8b969d]">
                    Calendario
                  </p>
                  <p className="mt-2 text-lg text-[#22313b]">
                    {selectedLead.calendarSyncStatus ?? "Pendiente de integrar"}
                  </p>
                  <p className="mt-2 text-sm text-[#6a7379]">
                    La agenda ya queda lista para una futura conexion con Google Calendar.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm text-[#6a7379]">Estado</span>
                  <select
                    name="status"
                    defaultValue={selectedLead.status}
                    disabled={!canEdit}
                    className="w-full rounded-2xl border border-[#e7ddd2] px-4 py-3 outline-none transition focus:border-[#9f6b44]"
                  >
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-[#6a7379]">Fecha y hora de visita</span>
                  <input
                    name="scheduled_at"
                    type="datetime-local"
                    defaultValue={selectedLead.scheduledAtValue ?? ""}
                    disabled={!canEdit}
                    className="w-full rounded-2xl border border-[#e7ddd2] px-4 py-3 outline-none transition focus:border-[#9f6b44]"
                  />
                </label>
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-[#ece4da] bg-[#fbf8f4] px-5 py-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[#8b969d]">
                  Mensaje del contacto
                </p>
                <p className="mt-3 text-sm leading-7 text-[#46535d]">
                  {selectedLead.message ?? "No dejo mensaje adicional."}
                </p>
              </div>

              <label className="mt-5 block space-y-2">
                <span className="text-sm text-[#6a7379]">Notas internas</span>
                <textarea
                  name="notes"
                  defaultValue={selectedLead.notes}
                  rows={6}
                  disabled={!canEdit}
                  className="w-full rounded-2xl border border-[#e7ddd2] px-4 py-3 outline-none transition focus:border-[#9f6b44]"
                />
              </label>

              <div className="mt-5">
                <EntityActivityList
                  title="Historial de este lead"
                  subtitle="Seguimiento reciente vinculado a esta consulta."
                  activities={selectedLeadActivities}
                  activityReady={activityReady}
                  emptyMessage="Todavia no hay movimientos registrados para este lead."
                />
              </div>

              <div className="mt-6 flex items-center justify-between gap-4">
                <p
                  className={`text-sm ${
                    saveState.type === "error"
                      ? "text-[#a04d39]"
                      : saveState.type === "success"
                        ? "text-[#39704a]"
                        : "text-[#6a7379]"
                  }`}
                >
                  {saveState.message || "Actualiza el estado y agrega notas de seguimiento."}
                </p>
                <button
                  type="submit"
                  disabled={isMutating || !crmReady || !canEdit}
                  className="rounded-full bg-[#1f3b4d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#274b60] disabled:cursor-not-allowed disabled:bg-[#94a3ad]"
                >
                  {isMutating ? "Guardando..." : "Guardar lead"}
                </button>
              </div>
              </fieldset>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
