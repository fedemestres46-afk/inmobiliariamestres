"use client";

import { useMemo, useState, useTransition } from "react";
import type { Lead, LeadStatus } from "@/data/leads";

type Props = {
  initialLeads: Lead[];
  crmReady: boolean;
};

type SaveState = {
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

export function AdminLeadsManager({ initialLeads, crmReady }: Props) {
  const [leads, setLeads] = useState(initialLeads);
  const [selectedLeadId, setSelectedLeadId] = useState(initialLeads[0]?.id ?? "");
  const [saveState, setSaveState] = useState<SaveState>({
    type: "idle",
    message: "",
  });
  const [isPending, startTransition] = useTransition();

  const selectedLead = leads.find((lead) => lead.id === selectedLeadId) ?? leads[0];

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

  async function handleSubmit(formData: FormData) {
    if (!selectedLead) {
      return;
    }

    const payload = {
      status: String(formData.get("status") ?? "Nuevo") as LeadStatus,
      notes: String(formData.get("notes") ?? ""),
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

  return (
    <>
      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          { label: "Nuevos", value: totals.nuevos },
          { label: "En curso", value: totals.enCurso },
          { label: "Cerrados", value: totals.cerrados },
        ].map((item) => (
          <article
            key={item.label}
            className="rounded-[1.5rem] border border-white/80 bg-white px-6 py-5 shadow-[0_18px_40px_rgba(35,43,50,0.06)]"
          >
            <p className="text-sm uppercase tracking-[0.3em] text-[#9f6b44]">
              {item.label}
            </p>
            <p className="mt-4 font-serif-display text-4xl">{item.value}</p>
          </article>
        ))}
      </section>

      {!crmReady ? (
        <section className="mt-8 rounded-[1.5rem] border border-[#eed8c4] bg-[#fff7ef] px-6 py-5 text-sm leading-7 text-[#7c624b]">
          La vista CRM ya esta lista, pero falta crear la tabla `leads` en
          Supabase para guardar consultas reales desde la web.
        </section>
      ) : null}

      <section className="mt-10 grid gap-8 xl:grid-cols-[1.08fr_0.92fr]">
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
            {leads.map((lead) => (
              <button
                key={lead.id}
                type="button"
                onClick={() => {
                  setSelectedLeadId(lead.id);
                  setSaveState({ type: "idle", message: "" });
                }}
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
                <label className="space-y-2">
                  <span className="text-sm text-[#6a7379]">Estado</span>
                  <select
                    name="status"
                    defaultValue={selectedLead.status}
                    className="w-full rounded-2xl border border-[#e7ddd2] px-4 py-3 outline-none transition focus:border-[#9f6b44]"
                  >
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="rounded-[1.5rem] border border-[#ece4da] px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#8b969d]">
                    Ingreso
                  </p>
                  <p className="mt-2 text-lg text-[#22313b]">
                    {selectedLead.createdAt}
                  </p>
                </div>
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
                  className="w-full rounded-2xl border border-[#e7ddd2] px-4 py-3 outline-none transition focus:border-[#9f6b44]"
                />
              </label>

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
                  disabled={isPending || !crmReady}
                  className="rounded-full bg-[#1f3b4d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#274b60] disabled:cursor-not-allowed disabled:bg-[#94a3ad]"
                >
                  {isPending ? "Guardando..." : "Guardar lead"}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
