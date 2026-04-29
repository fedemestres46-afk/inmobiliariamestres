import { NextResponse } from "next/server";
import {
  createAdminSessionToken,
  resolveAdminLoginAccess,
  setAdminSessionCookie,
} from "@/lib/auth";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase no esta configurado para iniciar sesion." },
      { status: 503 },
    );
  }

  const body = (await request.json()) as {
    email?: string;
    password?: string;
  };

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Completa email y contrasena." },
      { status: 400 },
    );
  }

  const access = await resolveAdminLoginAccess(email);

  if (!access) {
    return NextResponse.json(
      { error: "Este usuario no tiene acceso al panel administrador." },
      { status: 403 },
    );
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    const isInvalidApiKey = error?.message === "Invalid API key";

    return NextResponse.json(
      {
        error: error?.message ?? "No se pudo iniciar sesion.",
        ...(isInvalidApiKey
          ? {
              debug: {
                supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
                anonKeyPrefix:
                  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 24) ?? null,
                anonKeyLength:
                  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length ?? 0,
              },
            }
          : {}),
      },
      { status: 401 },
    );
  }

  await setAdminSessionCookie(
    createAdminSessionToken({
      userId: data.user.id,
      email: data.user.email ?? email,
      role: access.role,
      name: access.fullName,
    }),
  );

  return NextResponse.json({ success: true });
}
