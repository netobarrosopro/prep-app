import { NextRequest, NextResponse } from "next/server";

/**
 * Converte erros do Prisma em respostas JSON claras, para que o
 * formulário sempre receba uma mensagem em vez de um 500 sem corpo.
 */
export function dbErrorResponse(error: unknown): NextResponse {
  const code = (error as { code?: string })?.code;

  // Violação de unicidade (ex.: chassi duplicado)
  if (code === "P2002") {
    return NextResponse.json(
      { error: "Registro duplicado: já existe um cadastro com esse identificador." },
      { status: 409 }
    );
  }

  // Chave estrangeira violada: um registro relacionado não existe mais
  // (ex.: usuário da sessão foi apagado ao recriar o banco de dados)
  if (code === "P2003") {
    return NextResponse.json(
      {
        error:
          "Referência inválida: um registro relacionado não existe mais. " +
          "Se você recriou o banco de dados recentemente, saia (botão Sair) e " +
          "faça login novamente.",
      },
      { status: 409 }
    );
  }

  // Schema do banco desatualizado (coluna/tabela antiga ou constraint órfã)
  if (code === "P2011" || code === "P2021" || code === "P2022") {
    return NextResponse.json(
      {
        error:
          "O banco de dados local está desatualizado em relação ao app. " +
          "Pare o servidor e rode: npm run db:push -- --force-reset " +
          "(isso recria o banco; os dados de teste serão perdidos).",
      },
      { status: 500 }
    );
  }

  console.error("[db]", error);
  return NextResponse.json(
    { error: "Erro interno ao salvar. Tente novamente; se persistir, veja o log do servidor." },
    { status: 500 }
  );
}

type RouteHandler<Ctx> = (req: NextRequest, ctx: Ctx) => Promise<NextResponse>;

/**
 * Envolve um handler de rota inteiro: qualquer exceção não tratada vira
 * uma resposta JSON com mensagem clara, em vez de um 500 sem corpo
 * (que deixava o formulário preso em "Salvando...").
 */
export function withDbErrors<Ctx>(handler: RouteHandler<Ctx>): RouteHandler<Ctx> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      return dbErrorResponse(error);
    }
  };
}
