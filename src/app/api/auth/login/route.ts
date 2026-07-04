import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPasswordSafe, issueMfaCode } from "@/lib/auth";
import { createMfaPending } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { withDbErrors } from "@/lib/db-errors";

async function handlePOST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";

  const body = await req.json().catch(() => null);
  const username = String(body?.username ?? "").trim();
  const password = String(body?.password ?? "");

  const limit = rateLimit(`login:${ip}:${username}`, 5, 15 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Muitas tentativas. Tente novamente em ${limit.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  if (!username || !password) {
    return NextResponse.json({ error: "Informe usuário e senha." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  const valid = await verifyPasswordSafe(password, user?.passwordHash);
  if (!user || !valid) {
    // mensagem genérica para não revelar se o usuário existe
    return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
  }

  // Senha correta: envia código MFA ao e-mail cadastrado e cria estado pendente
  await issueMfaCode(user);
  await createMfaPending(user);

  const maskedEmail = user.email.replace(/^(.{2}).*(@.*)$/, "$1***$2");
  return NextResponse.json({ ok: true, next: "/verify", email: maskedEmail });
}

export const POST = withDbErrors(handlePOST);
