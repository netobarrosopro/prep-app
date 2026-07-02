import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Role } from "./constants";

const SESSION_COOKIE = "session";
const MFA_COOKIE = "mfa_pending";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 dias
const MFA_TTL_SECONDS = 60 * 10; // 10 minutos para concluir o MFA

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET não configurado (defina no .env com pelo menos 32 caracteres)"
    );
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  sub: string; // user id
  username: string;
  role: Role;
  purpose: "session" | "mfa";
}

async function sign(payload: SessionPayload, ttlSeconds: number): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttlSeconds)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

const isProd = process.env.NODE_ENV === "production";

const baseCookie = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax" as const,
  path: "/",
};

// Etapa 1 do login concluída (senha ok): cookie temporário aguardando o código MFA
export async function createMfaPending(user: {
  id: string;
  username: string;
  role: string;
}): Promise<void> {
  const token = await sign(
    { sub: user.id, username: user.username, role: user.role as Role, purpose: "mfa" },
    MFA_TTL_SECONDS
  );
  (await cookies()).set(MFA_COOKIE, token, { ...baseCookie, maxAge: MFA_TTL_SECONDS });
}

export async function getMfaPending(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(MFA_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.purpose === "mfa" ? payload : null;
}

// Etapa 2 concluída (código MFA validado): sessão completa
export async function createSession(user: {
  id: string;
  username: string;
  role: string;
}): Promise<void> {
  const store = await cookies();
  const token = await sign(
    { sub: user.id, username: user.username, role: user.role as Role, purpose: "session" },
    SESSION_TTL_SECONDS
  );
  store.set(SESSION_COOKIE, token, { ...baseCookie, maxAge: SESSION_TTL_SECONDS });
  store.delete(MFA_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.purpose === "session" ? payload : null;
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(MFA_COOKIE);
}

export const cookieNames = { SESSION_COOKIE, MFA_COOKIE };
