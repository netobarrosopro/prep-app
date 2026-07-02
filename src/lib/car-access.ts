import { prisma } from "./db";
import { getSession, type SessionPayload } from "./session";

export type CarWithRelations = NonNullable<Awaited<ReturnType<typeof findCarForUser>>>["car"];

/**
 * Carrega um carro e verifica se o usuário da sessão pode acessá-lo
 * (dono ou preparador atribuído).
 */
export async function findCarForUser(carId: string) {
  const session = await getSession();
  if (!session) return null;

  const car = await prisma.car.findUnique({
    where: { id: carId },
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
