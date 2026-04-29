import "server-only";

import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase";

export const adminRoles = ["owner", "admin", "editor", "viewer"] as const;
export type AdminRole = (typeof adminRoles)[number];

export type AdminAccess = {
  userId?: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  fullName?: string;
  source: "table" | "env" | "open";
};

const allowedEmails = (process.env.ADMIN_ALLOWED_EMAILS ?? "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

const adminSelect = "user_id, email, role, is_active, full_name";

type AdminUserRow = {
  user_id: string | null;
  email: string;
  role: AdminRole;
  is_active: boolean;
  full_name: string | null;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isMissingAdminUsersTable(error?: { message?: string; code?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    error?.code === "PGRST204" ||
    error?.code === "42P01" ||
    message.includes("admin_users") ||
    message.includes("relation") ||
    message.includes("schema cache")
  );
}

function fallbackAccess(email: string): AdminAccess {
  const normalizedEmail = normalizeEmail(email);

  if (allowedEmails.length > 0) {
    return {
      email: normalizedEmail,
      role: "owner",
      isActive: allowedEmails.includes(normalizedEmail),
      source: "env",
    };
  }

  return {
    email: normalizedEmail,
    role: "owner",
    isActive: true,
    source: "open",
  };
}

function mapAdminAccess(row: AdminUserRow): AdminAccess {
  return {
    userId: row.user_id ?? undefined,
    email: normalizeEmail(row.email),
    role: row.role,
    isActive: row.is_active,
    fullName: row.full_name ?? undefined,
    source: "table",
  };
}

export function formatAdminRoleLabel(role: AdminRole) {
  switch (role) {
    case "owner":
      return "Owner";
    case "admin":
      return "Admin";
    case "editor":
      return "Editor";
    default:
      return "Viewer";
  }
}

export function canManageContent(role: AdminRole) {
  return role === "owner" || role === "admin" || role === "editor";
}

export async function getAdminAccessByEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);

  if (!isSupabaseAdminConfigured()) {
    return fallbackAccess(normalizedEmail);
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("admin_users")
      .select(adminSelect)
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (error) {
      if (isMissingAdminUsersTable(error)) {
        return fallbackAccess(normalizedEmail);
      }

      console.error("No se pudo validar admin_users por email.", error);
      return null;
    }

    if (!data) {
      return fallbackAccess(normalizedEmail);
    }

    return mapAdminAccess(data as AdminUserRow);
  } catch (error) {
    console.error("Fallo la consulta de admin_users por email.", error);
    return null;
  }
}

export async function getAdminAccessByUserId(userId: string, email?: string) {
  if (!isSupabaseAdminConfigured()) {
    return email ? fallbackAccess(email) : null;
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("admin_users")
      .select(adminSelect)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      if (isMissingAdminUsersTable(error)) {
        return email ? fallbackAccess(email) : null;
      }

      console.error("No se pudo validar admin_users por user_id.", error);
      return null;
    }

    if (data) {
      return mapAdminAccess(data as AdminUserRow);
    }

    if (email) {
      return fallbackAccess(email);
    }

    return null;
  } catch (error) {
    console.error("Fallo la consulta de admin_users por user_id.", error);
    return email ? fallbackAccess(email) : null;
  }
}
