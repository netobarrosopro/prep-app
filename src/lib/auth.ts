import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "./db";
import { sendMfaCode } from "./mailer";

const BCRYPT_ROUNDS = 12;
const MFA_CODE_TTL_MS = 10 * 60 * 1000; // 10 minutos
const MFA_MAX_ATTEMPTS = 5;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Hash de referência para manter tempo constante quando o usuário não existe
const DUMMY_HASH = bcrypt.hashSync("senha-invalida-dummy", BCRYPT_ROUNDS);

export async function verifyPasswordSafe(
  password: string,
  hash: string | undefined
): Promise<boolean> {
  const result = await bcrypt.compare(password, hash ?? DUMMY_HASH);
  return hash ? result : false;
}

/**
 * Gera um código MFA de 6 dígitos, guarda apenas o hash e envia por e-mail.
 * Códigos anteriores ainda pendentes são invalidados.
 */
export async function issueMfaCode(user: { id: string; email: string }): Promise<void> {
  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
  const codeHash = await bcrypt.hash(code, BCRYPT_ROUNDS);

  await prisma.mfaCode.deleteMany({ where: { userId: user.id, consumedAt: null } });
  await prisma.mfaCode.create({
    data: {
      userId: user.id,
      codeHash,
      expiresAt: new Date(Date.now() + MFA_CODE_TTL_MS),
    },
  });

  await sendMfaCode(user.email, code);
}

export type MfaResult =
  | { ok: true }
  | { ok: false; reason: "expirado" | "invalido" | "bloqueado" };

/**
 * Valida o código MFA informado. Limita tentativas e consome o código ao acertar.
 */
export async function consumeMfaCode(userId: string, code: string): Promise<MfaResult> {
  const record = await prisma.mfaCode.findFirst({
    where: { userId, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!record || record.expiresAt < new Date()) {
    return { ok: false, reason: "expirado" };
  }
  if (record.attempts >= MFA_MAX_ATTEMPTS) {
    return { ok: false, reason: "bloqueado" };
  }

  const matches = await bcrypt.compare(code, record.codeHash);
  if (!matches) {
    await prisma.mfaCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return {
      ok: false,
      reason: record.attempts + 1 >= MFA_MAX_ATTEMPTS ? "bloqueado" : "invalido",
    };
  }

  await prisma.mfaCode.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  });
  return { ok: true };
}
