import { prisma } from "./db";
import { getSession, type SessionPayload } from "./session";

export type CarWithRelations = NonNullable<Awaited<ReturnType<typeof findCarForUser>>>["car"];

// Chassi: 3–30 caracteres, letras/números/hífen (normalizado em maiúsculas)
export const CHASSIS_RE = /^[A-Z0-9-]{3,30}$/;

export function normalizeChassis(value: unknown): string {
  return String(value ?? "").trim().toUpperCase();
}

/**
 * Carrega um carro pelo chassi (chave primária) e verifica se o usuário
 * da sessão pode acessá-lo (dono ou preparador atribuído).
 */
export async function findCarForUser(chassis: string) {
  const session = await getSession();
  if (!session) return null;

  const car = await prisma.car.findUnique({
    where: { chassis: normalizeChassis(decodeURIComponent(chassis)) },
    include: {
      owner: { select: { id: true, username: true } },
      preparador: { select: { id: true, username: true } },
      modifications: {
        orderBy: { createdAt: "desc" },
        include: { createdBy: { select: { username: true } } },
      },
    },
  });

  if (!car) return null;
  const isOwner = car.ownerId === session.sub;
  const isPreparador = car.preparadorId === session.sub;
  if (!isOwner && !isPreparador) return null;

  return { car, session, isOwner, isPreparador };
}

export function unauthorized() {
  return { error: "Não autorizado." };
}

export type AuthedSession = SessionPayload;
