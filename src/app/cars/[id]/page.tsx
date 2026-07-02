import { notFound } from "next/navigation";
import { findCarForUser } from "@/lib/car-access";
import {
  CATEGORY_LABELS,
  MOD_TYPE_LABELS,
  MOD_STATUS_LABELS,
  type Category,
  type ModType,
  type ModStatus,
} from "@/lib/constants";
import { ModificationForm } from "@/components/ModificationForm";
import { ModStatusControl } from "@/components/ModStatusControl";
import { AssignPreparador } from "@/components/AssignPreparador";

export const dynamic = "force-dynamic";

export default async function CarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await findCarForUser(id);
  if (!access) notFound();

  const { car, isOwner } = access;

  const specs: Array<[string, string | null]> = [
    ["Categoria", CATEGORY_LABELS[car.category as Category] ?? car.category],
    ["Placa", car.plate],
    ["Chassi", car.chassis],
    ["Cor", car.color],
    ["Motor", car.engine],
    ["Potência", car.power ? `${car.power} cv` : null],
    ["Combustível", car.fuel],
    ["Peso", car.weight ? `${car.weight} kg` : null],
  ];

  return (
    <main className="container">
      <div className="page-title">
        <h1>
          {car.brand} {car.model} {car.year}
        </h1>
        <span className="badge cat">
          {CATEGORY_LABELS[car.category as Category] ?? car.category}
        </span>
      </div>

      <section className="panel">
        <h2>Ficha técnica</h2>
        <dl className="spec-grid">
          {specs
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <div className="spec" key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          <div className="spec">
            <dt>Dono</dt>
            <dd>{car.owner.username}</dd>
          </div>
          <div className="spec">
            <dt>Preparador</dt>
            <dd>{car.preparador?.username ?? "não atribuído"}</dd>
          </div>
        </dl>
        {car.notes && (
          <p style={{ marginTop: 16, color: "var(--text-muted)" }}>{car.notes}</p>
        )}
        {isOwner && <AssignPreparador carId={car.id} current={car.preparador?.username} />}
      </section>

      <section className="panel">
        <h2>Mudanças e adaptações</h2>
        <ModificationForm carId={car.id} />

        {car.modifications.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 16 }}>
            Nenhuma modificação registrada ainda.
          </div>
        ) : (
          <div style={{ marginTop: 20 }}>
            {car.modifications.map((mod) => (
              <div className="mod-item" key={mod.id}>
                <div className="mod-head">
                  <h3>{mod.title}</h3>
                  <span className={`badge status-${mod.status}`}>
                    {MOD_STATUS_LABELS[mod.status as ModStatus] ?? mod.status}
                  </span>
                </div>
                {mod.description && <p className="mod-desc">{mod.description}</p>}
                <div className="mod-footer">
                  <span className="badge">
                    {MOD_TYPE_LABELS[mod.type as ModType] ?? mod.type}
                  </span>
                  {mod.cost !== null && (
                    <span>
                      R${" "}
                      {mod.cost.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  )}
                  <span>
                    por {mod.createdBy?.username ?? "—"} em{" "}
                    {new Date(mod.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                  <ModStatusControl
                    carId={car.id}
                    modId={mod.id}
                    status={mod.status}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
