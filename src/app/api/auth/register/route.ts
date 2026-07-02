import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { ROLES } from "@/lib/constants";

const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,30}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  const limit = rateLimit(`register:${ip}`, 10, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Muitas tentativas. Tente novamente em ${limit.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const username = String(body?.username ?? "").trim();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  const role = String(body?.role ?? "");

  if (!USERNAME_RE.test(username)) {
    return NextResponse.json(
      { error: "Nome de usuário deve ter 3–30 caracteres (letras, números, . _ -)." },
      { status: 400 }
    );
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "A senha deve ter pelo menos 8 caracteres." },
      { status: 400 }
    );
  }
  if (!(ROLES as readonly string[]).includes(role)) {
    return NextResponse.json(
      { error: "Perfil inválido: escolha Dono ou Preparador." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Nome de usuário ou e-mail já cadastrado." },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.create({ data: { username, email, passwordHash, role } });

  return NextResponse.json({ ok: true }, { status: 201 });
}
