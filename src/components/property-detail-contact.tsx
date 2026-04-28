"use client";

import { useState, useTransition } from "react";
import type { Lead } from "@/data/leads";

type Props = {
  propertyId: string;
  propertyTitle: string;
};

type InquiryState = {
  type: "idle" | "success" | "error";
  message: string;
};

export function PropertyDetailContact({
  propertyId,
  propertyTitle,
}: Props) {
  const [inquiryState, setInquiryState] = useState<InquiryState>({
    type: "idle",
    message: "",
  });
  const [isSubmittingLead, startLeadTransition] = useTransition();

  async function handleLeadSubmit(formData: FormData) {
    const payload = {
      propertyId,
      fullName: String(formData.get("full_name") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      message: String(formData.get("message") ?? "").trim(),
    };

    startLeadTransition(async () => {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as
        | { lead?: Lead; error?: string }
        | undefined;

      if (!response.ok || !result?.lead) {
        setInquiryState({
          type: "error",
          message:
            result?.error ?? "No se pudo enviar la consulta en este momento.",
        });
        return;
      }

      setInquiryState({
        type: "success",
        message: "Consulta enviada. Ya quedo asociada a esta propiedad.",
      });
    });
  }

  return (
    <section>
      <article className="rounded-[2rem] border border-[var(--color-line)] bg-white p-7 shadow-[0_18px_50px_rgba(35,43,50,0.06)]">
        <h2 className="mt-3 font-serif-display text-4xl">
          Consulta directa
        </h2>
        <p className="mt-5 text-lg leading-8 text-[var(--color-muted)]">
          Dejanos tus datos y te contactamos con mas informacion sobre esta propiedad.
        </p>

        <form action={handleLeadSubmit} className="mt-6 space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <input
              name="full_name"
              required
              placeholder="Nombre y apellido"
              className="w-full rounded-full border border-[var(--color-line)] bg-[var(--color-cream)] px-4 py-3 outline-none"
            />
            <input
              name="phone"
              required
              placeholder="Telefono"
              className="w-full rounded-full border border-[var(--color-line)] bg-[var(--color-cream)] px-4 py-3 outline-none"
            />
          </div>
          <input
            name="email"
            placeholder="Email (opcional)"
            className="w-full rounded-full border border-[var(--color-line)] bg-[var(--color-cream)] px-4 py-3 outline-none"
          />
          <textarea
            name="message"
            rows={4}
            defaultValue={`Hola, quiero mas informacion sobre ${propertyTitle}.`}
            className="w-full rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-cream)] px-4 py-3 outline-none"
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p
              className={`text-sm ${
                inquiryState.type === "error"
                  ? "text-[#a04d39]"
                  : inquiryState.type === "success"
                    ? "text-[#39704a]"
                    : "text-[var(--color-muted)]"
              }`}
            >
              {inquiryState.message ||
                "La consulta se registrara como lead nuevo dentro del CRM."}
            </p>
            <button
              type="submit"
              disabled={isSubmittingLead}
              className="rounded-full bg-[var(--color-deep)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmittingLead ? "Enviando..." : "Enviar consulta"}
            </button>
          </div>
        </form>
      </article>
    </section>
  );
}
