import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { findCarForUser, CHASSIS_RE, normalizeChassis } from "@/lib/car-access";
import { CATEGORIES } from "@/lib/constants";

// O parâmetro [id] da rota é o chassi do carro (chave primária)
type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const access = await findCarForUser(id);
  if (!access) return NextResponse.json({ error: "Não autorizado." }, { status: 404 });
  return NextResponse.json({ car: access.car });
}

// Atualiza o cadastro do carro.
// Dono: todos os campos, incluindo o próprio chassi e a troca de preparador.
// Preparador: apenas ficha técnica (motor, potência, combustível, peso, observações).
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const access = await findCarForUser(id);
  if (!access) return NextResponse.json({ error: "Não autorizado." }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const data: Record<string, unknown> = {};

  // Campos técnicos: dono e preparador
  if (body.engine !== undefined) data.engine = String(body.engine).trim() || null;
  if (body.power !== undefined) data.power = Number(body.power) || null;
  if (body.fuel !== undefined) data.fuel = String(body.fuel).trim() || null;
  if (body.weight !== undefined) data.weight = Number(body.weight) || null;
  if (body.notes !== undefined) data.notes = String(body.notes).trim() || null;

  // Campos restritos ao dono
  if (access.isOwner) {
    if (body.brand !== undefined) {
      const brand = String(body.brand).trim();
      if (!brand) return NextResponse.json({ error: "Marca obrigatória." }, { status: 400 });
      data.brand = brand;
    }
    if (body.model !== undefined) {
      const model = String(body.model).trim();
      if (!model) return NextResponse.json({ error: "Modelo obrigatório." }, { status: 400 });
      data.model = model;
    }
    if (body.year !== undefined) {
      const year = Number(body.year);
      if (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear() + 1) {
        return NextResponse.json({ error: "Ano inválido." }, { status: 400 });
      }
      data.year = year;
    }
    if (body.category !== undefined) {
      if (!(CATEGORIES as readonly string[]).includes(String(body.category))) {
        return NextResponse.json({ error: "Categoria inválida." }, { status: 400 });
      }
      data.category = String(body.category);
    }
    if (body.plate !== undefined) data.plate = String(body.plate).trim().toUpperCase() || null;
    if (body.color !== undefined) data.color = String(body.color).trim() || null;

    // Troca de chassi (chave primária): valida formato e duplicidade;
    // as modificações são atualizadas em cascata.
    if (body.chassis !== undefined) {
      const chassis = normalizeChassis(body.chassis);
      if (!CHASSIS_RE.test(chassis)) {
        return NextResponse.json(
          { error: "Chassi inválido: 3–30 caracteres (letras, números e hífen)." },
          { status: 400 }
        );
      }
      if (chassis !== access.car.chassis) {
        const duplicate = await prisma.car.findUnique({ where: { chassis } });
        if (duplicate) {
          return NextResponse.json(
            { error: `Já existe um carro cadastrado com o chassi ${chassis}.` },
            { status: 409 }
          );
        }
        data.chassis = chassis;
      }
    }

    if (body.preparadorUsername !== undefined) {
      const username = String(body.preparadorUsername).trim();
      if (!username) {
        data.preparadorId = null;
      } else {
        const preparador = await prisma.user.findUnique({ where: { username } });
        if (!preparador || preparador.role !== "PREPARADOR") {
          return NextResponse.json(
            { error: `Preparador "${username}" não encontrado.` },
            { status: 400 }
          );
        }
        data.preparadorId = preparador.id;
      }
    }
  }

  const car = await prisma.car.update({
    where: { chassis: access.car.chassis },
    data,
  });
  return NextResponse.json({ ok: true, car });
}

// Remove o carro (somente Dono)
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const access = await findCarForUser(id);
  if (!access || !access.isOwner) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 404 });
  }
  await prisma.car.delete({ where: { chassis: access.car.chassis } });
  return NextResponse.json({ ok: true });
}
