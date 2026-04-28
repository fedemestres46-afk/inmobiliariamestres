"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type FormState = {
  type: "idle" | "error";
  message: string;
};

export function AdminLoginForm() {
  const router = useRouter();
  const [state, setState] = useState<FormState>({ type: "idle", message: "" });
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    const payload = {
      email: String(formData.get("email") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
    };

    startTransition(async () => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as { error?: string } | undefined;

      if (!response.ok) {
        setState({
          type: "error",
          message: result?.error ?? "No se pudo iniciar sesion.",
        });
        return;
      }

      router.push("/admin");
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <label className="block space-y-2">
        <span className="text-sm text-[#6a7379]">Email</span>
        <input
          name="email"
          type="email"
          required
          className="w-full rounded-2xl border border-[#e7ddd2] px-4 py-3 outline-none transition focus:border-[#9f6b44]"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm text-[#6a7379]">Contrasena</span>
        <input
          name="password"
          type="password"
          required
          className="w-full rounded-2xl border border-[#e7ddd2] px-4 py-3 outline-none transition focus:border-[#9f6b44]"
        />
      </label>

      {state.type === "error" ? (
        <p className="text-sm text-[#a04d39]">{state.message}</p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-[#1f3b4d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#274b60] disabled:cursor-not-allowed disabled:bg-[#94a3ad]"
      >
        {isPending ? "Ingresando..." : "Ingresar al panel"}
      </button>
    </form>
  );
}
