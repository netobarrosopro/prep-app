import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { consumeMfaCode } from "@/lib/auth";
import { getMfaPending, createSession } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const pending = await getMfaPending();
  if (!pending) {
    return NextResponse.json(
      { error: "Sessão de verificação expirada. Faça login novamente." },
      { status: 401 }
    );
  }

  const limit = rateLimit(`verify:${pending.sub}`, 10, 15 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Muitas tentativas. Tente novamente em ${limit.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const code = String(body?.code ?? "").trim();
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Informe o código de 6 dígitos." }, { status: 400 });
  }

  const result = await consumeMfaCode(pending.sub, code);
  if (!result.ok) {
    const messages = {
      expirado: "Código expirado. Faça login novamente para receber um novo.",
      invalido: "Código incorreto. Verifique o e-mail e tente novamente.",
      bloqueado: "Número máximo de tentativas atingido. Faça login novamente.",
    } as const;
    return NextResponse.json({ error: messages[result.reason] }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: pending.sub } });
  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 401 });
  }

  await createSession(user);
  return NextResponse.json({ ok: true, next: "/dashboard" });
}
