"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function AdminLogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => {
        startTransition(async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          router.push("/admin/login");
          router.refresh();
        });
      }}
      className="rounded-full border border-[#d8cabd] bg-white px-5 py-3 text-sm font-semibold text-[#5c666d] transition hover:bg-[#f7efe5]"
    >
      {isPending ? "Saliendo..." : "Cerrar sesion"}
    </button>
  );
}
