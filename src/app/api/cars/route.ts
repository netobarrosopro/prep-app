import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { CATEGORIES } from "@/lib/constants";

// Lista os carros visíveis ao usuário (dono: seus carros; preparador: carros atribuídos)
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const cars = await prisma.car.findMany({
    where: { OR: [{ ownerId: session.sub }, { preparadorId: session.sub }] },
    include: {
      owner: { select: { username: true } },
      preparador: { select: { username: true } },
      _count: { select: { modifications: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ cars });
}

// Cadastra um novo carro (somente Dono)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  if (session.role !== "DONO") {
    return NextResponse.json(
      { error: "Apenas o dono pode cadastrar um carro." },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const brand = String(body?.brand ?? "").trim();
  const model = String(body?.model ?? "").trim();
  const year = Number(body?.year);
  const category = String(body?.category ?? "");
  const preparadorUsername = String(body?.preparadorUsername ?? "").trim();

  if (!brand || !model) {
    return NextResponse.json({ error: "Informe marca e modelo." }, { status: 400 });
  }
  const currentYear = new Date().getFullYear();
  if (!Number.isInteger(year) || year < 1900 || year > currentYear + 1) {
    return NextResponse.json({ error: "Ano inválido." }, { status: 400 });
  }
  if (!(CATEGORIES as readonly string[]).includes(category)) {
    return NextResponse.json({ error: "Categoria inválida." }, { status: 400 });
  }

  let preparadorId: string | null = null;
  if (preparadorUsername) {
    const preparador = await prisma.user.findUnique({
      where: { username: preparadorUsername },
    });
    if (!preparador || preparador.role !== "PREPARADOR") {
      return NextResponse.json(
        { error: `Preparador "${preparadorUsername}" não encontrado.` },
        { status: 400 }
      );
    }
    preparadorId = preparador.id;
  }

  const car = await prisma.car.create({
    data: {
      ownerId: session.sub,
      preparadorId,
      brand,
      model,
      year,
      category,
      plate: body?.plate ? String(body.plate).trim().toUpperCase() : null,
      chassis: body?.chassis ? String(body.chassis).trim() : null,
      color: body?.color ? String(body.color).trim() : null,
      engine: body?.engine ? String(body.engine).trim() : null,
      power: body?.power ? Number(body.power) || null : null,
      fuel: body?.fuel ? String(body.fuel).trim() : null,
      weight: body?.weight ? Number(body.weight) || null : null,
      notes: body?.notes ? String(body.notes).trim() : null,
    },
  });

  return NextResponse.json({ ok: true, car }, { status: 201 });
}
