import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { CATEGORY_LABELS, type Category } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const cars = await prisma.car.findMany({
    where: { OR: [{ ownerId: session.sub }, { preparadorId: session.sub }] },
    include: {
      owner: { select: { username: true } },
      preparador: { select: { username: true } },
      _count: { select: { modifications: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const isDono = session.role === "DONO";

  return (
    <main className="container">
      <div className="page-title">
        <h1>{isDono ? "Meus carros" : "Carros sob minha preparação"}</h1>
        {isDono && (
          <Link href="/cars/new" className="btn">
            + Cadastrar carro
          </Link>
        )}
      </div>

      {cars.length === 0 ? (
        <div className="empty-state">
          {isDono ? (
            <>
              <p>Você ainda não cadastrou nenhum carro.</p>
              <p style={{ marginTop: 12 }}>
                <Link href="/cars/new">Cadastre o primeiro projeto →</Link>
              </p>
            </>
          ) : (
            <p>
              Nenhum carro atribuído a você ainda. Peça ao dono para atribuir
              seu usuário como preparador do projeto.
            </p>
          )}
        </div>
      ) : (
        <div className="card-grid">
          {cars.map((car) => (
            <Link key={car.id} href={`/cars/${car.id}`} className="car-card">
              <h2>
                {car.brand} {car.model} {car.year}
              </h2>
              <p className="meta">
                <span className="badge cat">
                  {CATEGORY_LABELS[car.category as Category] ?? car.category}
                </span>
              </p>
              <p className="meta" style={{ marginTop: 8 }}>
                Dono: {car.owner.username}
                <br />
                Preparador: {car.preparador?.username ?? "não atribuído"}
                <br />
                {car._count.modifications} modificação(ões)
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
