import { prisma } from "./db";
import { getSession, destroySession, type SessionPayload } from "./session";
import type { User } from "@prisma/client";

/**
 * Sessão validada contra o banco: além do cookie assinado, confirma que o
 * usuário ainda existe (ele pode ter sido removido, por exemplo, ao recriar
 * o banco de desenvolvimento com a sessão do navegador ainda ativa).
 */
export async function getSessionUser(): Promise<
  { session: SessionPayload; user: User } | null
> {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user) return null;

  return { session, user };
}

/** Igual a getSessionUser, mas também limpa os cookies de uma sessão órfã. */
export async function requireSessionUser() {
  const result = await getSessionUser();
  if (!result) {
    await destroySession().catch(() => {});
    return null;
  }
  return result;
}

export const SESSION_INVALID_MESSAGE =
  "Sua sessão não é mais válida (o usuário não existe mais neste banco de dados). " +
  "Faça login novamente — se você recriou o banco, cadastre-se de novo.";
