import { notFound } from "next/navigation";
import { findCarForUser } from "@/lib/car-access";
import { CarEditForm } from "@/components/CarEditForm";

export const dynamic = "force-dynamic";

export default async function EditCarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await findCarForUser(id);
  if (!access) notFound();

  const { car, isOwner } = access;

  return (
    <main className="container">
      <div className="page-title">
        <h1>
          Editar — {car.brand} {car.model} {car.year}
        </h1>
      </div>
      <CarEditForm
        isOwner={isOwner}
        car={{
          chassis: car.chassis,
          brand: car.brand,
          model: car.model,
          year: car.year,
          category: car.category,
          plate: car.plate,
          color: car.color,
          engine: car.engine,
          power: car.power,
          fuel: car.fuel,
          weight: car.weight,
          notes: car.notes,
          preparadorUsername: car.preparador?.username ?? "",
        }}
      />
    </main>
  );
}
