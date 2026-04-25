import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "node:crypto";

export type Role = "admin" | "viewer";
export type Session = { role: Role; iat: number };

const COOKIE_NAME = "rmt-session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      "SESSION_SECRET env var is required (≥16 chars). Set it in .env.local locally and Railway service Variables in production.",
    );
  }
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function encode(session: Session): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decode(token: string): Session | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  if (!safeEqual(sign(payload), sig)) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString(),
    ) as Session;
    if (parsed.role !== "admin" && parsed.role !== "viewer") return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const c = await cookies();
  const t = c.get(COOKIE_NAME)?.value;
  if (!t) return null;
  return decode(t);
}

export async function isAuthed(): Promise<boolean> {
  return (await getSession()) !== null;
}

export async function isAdmin(): Promise<boolean> {
  return (await getSession())?.role === "admin";
}

export async function requireAuth(): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/login");
  return s;
}

export async function requireAdmin(): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.role !== "admin") {
    throw new Error("Forbidden: this action requires admin (HR officer) role.");
  }
  return s;
}

/**
 * Verify password against ADMIN_PASSWORD / VIEWER_PASSWORD env vars.
 * Returns the matched role, or null if neither matched.
 */
export function checkPassword(password: string): Role | null {
  const admin = process.env.ADMIN_PASSWORD;
  const viewer = process.env.VIEWER_PASSWORD;
  if (admin && safeEqual(password, admin)) return "admin";
  if (viewer && safeEqual(password, viewer)) return "viewer";
  return null;
}

export async function setSessionCookie(role: Role): Promise<void> {
  const c = await cookies();
  c.set(COOKIE_NAME, encode({ role, iat: Date.now() }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const c = await cookies();
  c.delete(COOKIE_NAME);
}
