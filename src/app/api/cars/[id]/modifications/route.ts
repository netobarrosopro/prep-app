import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { findCarForUser } from "@/lib/car-access";
import { MOD_TYPES, MOD_STATUSES } from "@/lib/constants";

type Params = { params: Promise<{ id: string }> };

// Registra uma mudança/adaptação no carro (dono ou preparador atribuído)
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const access = await findCarForUser(id);
  if (!access) return NextResponse.json({ error: "Não autorizado." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const type = String(body?.type ?? "");
  const title = String(body?.title ?? "").trim();
  const description = String(body?.description ?? "").trim();
  const status = String(body?.status ?? "PLANEJADA");
  const cost = body?.cost !== undefined && body?.cost !== "" ? Number(body.cost) : null;

  if (!(MOD_TYPES as readonly string[]).includes(type)) {
    return NextResponse.json({ error: "Tipo de modificação inválido." }, { status: 400 });
  }
  if (!title) {
    return NextResponse.json({ error: "Informe um título para a modificação." }, { status: 400 });
  }
  if (!(MOD_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: "Status inválido." }, { status: 400 });
  }
  if (cost !== null && (!Number.isFinite(cost) || cost < 0)) {
    return NextResponse.json({ error: "Custo inválido." }, { status: 400 });
  }

  const modification = await prisma.modification.create({
    data: {
      carId: id,
      createdById: access.session.sub,
      type,
      title,
      description: description || null,
      status,
      cost,
    },
  });

  return NextResponse.json({ ok: true, modification }, { status: 201 });
}
