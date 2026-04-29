import "server-only";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  canManageContent,
  formatAdminRoleLabel,
  getAdminAccessByEmail,
  getAdminAccessByUserId,
  type AdminRole,
} from "@/lib/admin-access";

const sessionCookieName = "mestres_admin_session";
const sessionTtlSeconds = 60 * 60 * 24 * 7;
const authSecret =
  process.env.ADMIN_AUTH_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

type SessionPayload = {
  sub: string;
  email: string;
  role: AdminRole;
  name?: string;
  exp: number;
};

function toBase64Url(value: string) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64").toString("utf8");
}

function signToken(payload: SessionPayload) {
  if (!authSecret) {
    throw new Error("Falta ADMIN_AUTH_SECRET o SUPABASE_SERVICE_ROLE_KEY.");
  }

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = crypto
    .createHmac("sha256", authSecret)
    .update(encodedPayload)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return `${encodedPayload}.${signature}`;
}

function verifyToken(token: string) {
  if (!authSecret) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = crypto
    .createHmac("sha256", authSecret)
    .update(encodedPayload)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as SessionPayload;
    if (payload.exp * 1000 <= Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function resolveAdminLoginAccess(email: string) {
  const access = await getAdminAccessByEmail(email);

  if (!access?.isActive) {
    return null;
  }

  return access;
}

export function createAdminSessionToken(input: {
  userId: string;
  email: string;
  role: AdminRole;
  name?: string;
}) {
  return signToken({
    sub: input.userId,
    email: input.email,
    role: input.role,
    ...(input.name ? { name: input.name } : {}),
    exp: Math.floor(Date.now() / 1000) + sessionTtlSeconds,
  });
}

export async function setAdminSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionTtlSeconds,
  });
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

export async function requireAdminSession() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return session;
}

export async function requireAdminAccess() {
  const access = await getCurrentAdminAccess();

  if (!access) {
    redirect("/admin/login");
  }

  return access;
}

export async function getCurrentAdminAccess() {
  const session = await getAdminSession();

  if (!session) {
    return null;
  }

  const access = await getAdminAccessByUserId(session.sub, session.email);

  if (!access?.isActive) {
    await clearAdminSessionCookie();
    return null;
  }

  return {
    ...session,
    role: access.role,
    name: access.fullName ?? session.name,
  };
}

export async function getAdminWriteAccess() {
  const session = await getCurrentAdminAccess();

  if (!session) {
    return null;
  }

  if (!canManageContent(session.role)) {
    return null;
  }

  return session;
}

export function getAdminAccessDeniedMessage(role: AdminRole) {
  return `Tu rol actual (${formatAdminRoleLabel(role)}) no tiene permisos para editar este contenido.`;
}
