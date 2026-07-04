import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { findCarForUser } from "@/lib/car-access";
import { MOD_STATUSES, MOD_TYPES } from "@/lib/constants";

type Params = { params: Promise<{ id: string; modId: string }> };

// Atualiza uma modificação (dono ou preparador atribuído)
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id, modId } = await params;
  const access = await findCarForUser(id);
  if (!access) return NextResponse.json({ error: "Não autorizado." }, { status: 404 });

  const existing = await prisma.modification.findFirst({
    where: { id: modId, carChassis: access.car.chassis },
  });
  if (!existing) {
    return NextResponse.json({ error: "Modificação não encontrada." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const data: Record<string, unknown> = {};

  if (body?.status !== undefined) {
    if (!(MOD_STATUSES as readonly string[]).includes(String(body.status))) {
      return NextResponse.json({ error: "Status inválido." }, { status: 400 });
    }
    data.status = String(body.status);
  }
  if (body?.type !== undefined) {
    if (!(MOD_TYPES as readonly string[]).includes(String(body.type))) {
      return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
    }
    data.type = String(body.type);
  }
  if (body?.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) return NextResponse.json({ error: "Título obrigatório." }, { status: 400 });
    data.title = title;
  }
  if (body?.description !== undefined) {
    data.description = String(body.description).trim() || null;
  }
  if (body?.cost !== undefined) {
    const cost = body.cost === "" || body.cost === null ? null : Number(body.cost);
    if (cost !== null && (!Number.isFinite(cost) || cost < 0)) {
      return NextResponse.json({ error: "Custo inválido." }, { status: 400 });
    }
    data.cost = cost;
  }

  const modification = await prisma.modification.update({
    where: { id: modId },
    data,
  });
  return NextResponse.json({ ok: true, modification });
}

// Remove uma modificação (dono ou preparador atribuído)
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id, modId } = await params;
  const access = await findCarForUser(id);
  if (!access) return NextResponse.json({ error: "Não autorizado." }, { status: 404 });

  const existing = await prisma.modification.findFirst({
    where: { id: modId, carChassis: access.car.chassis },
  });
  if (!existing) {
    return NextResponse.json({ error: "Modificação não encontrada." }, { status: 404 });
  }

  await prisma.modification.delete({ where: { id: modId } });
  return NextResponse.json({ ok: true });
}
