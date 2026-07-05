"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/constants";
import { jsonRequest, sanitizeChassisInput } from "@/lib/client";

interface CarData {
  chassis: string;
  brand: string;
  model: string;
  year: number;
  category: string;
  plate: string | null;
  color: string | null;
  engine: string | null;
  power: number | null;
  fuel: string | null;
  weight: number | null;
  notes: string | null;
  preparadorUsername: string;
}

// Renderizado apenas para o dono do carro (a página de edição bloqueia o preparador)
export function CarEditForm({ car }: { car: CarData }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const result = await jsonRequest(
      `/api/cars/${encodeURIComponent(car.chassis)}`,
      "PATCH",
      Object.fromEntries(form.entries())
    );
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    // Se o chassi mudou, a URL do carro muda junto
    const updated = result.data.car as { chassis: string };
    router.push(`/cars/${encodeURIComponent(updated.chassis)}`);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Excluir este carro e todas as suas modificações? Essa ação não pode ser desfeita.")) {
      return;
    }
    setLoading(true);
    const result = await jsonRequest(
      `/api/cars/${encodeURIComponent(car.chassis)}`,
      "DELETE"
    );
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <>
      {error && <div className="error-box">{error}</div>}
      <form onSubmit={handleSubmit} className="panel">
        <div className="form-grid">
            <div className="field">
              <label htmlFor="brand">Marca *</label>
              <input id="brand" name="brand" defaultValue={car.brand} required />
            </div>
            <div className="field">
              <label htmlFor="model">Modelo *</label>
              <input id="model" name="model" defaultValue={car.model} required />
            </div>
            <div className="field">
              <label htmlFor="year">Ano *</label>
              <input
                id="year"
                name="year"
                type="number"
                min={1900}
                max={new Date().getFullYear() + 1}
                defaultValue={car.year}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="category">Categoria *</label>
              <select id="category" name="category" defaultValue={car.category} required>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="chassis">Chassi * (identificador único)</label>
              <input
                id="chassis"
                name="chassis"
                defaultValue={car.chassis}
                pattern="[A-Za-z0-9\-]{3,30}"
                title="3–30 caracteres: letras, números e hífen"
                minLength={3}
                maxLength={30}
                onInput={sanitizeChassisInput}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="plate">Placa</label>
              <input id="plate" name="plate" defaultValue={car.plate ?? ""} />
            </div>
            <div className="field">
              <label htmlFor="color">Cor</label>
              <input id="color" name="color" defaultValue={car.color ?? ""} />
            </div>
            <div className="field">
              <label htmlFor="preparadorUsername">Preparador (usuário)</label>
              <input
                id="preparadorUsername"
                name="preparadorUsername"
                defaultValue={car.preparadorUsername}
                placeholder="deixe vazio para remover"
              />
            </div>
        </div>

        <h2 style={{ fontSize: 15, margin: "8px 0 16px", color: "var(--text-muted)" }}>
          Ficha técnica
        </h2>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="engine">Motor</label>
            <input id="engine" name="engine" defaultValue={car.engine ?? ""} />
          </div>
          <div className="field">
            <label htmlFor="power">Potência (cv)</label>
            <input
              id="power"
              name="power"
              type="number"
              min={0}
              defaultValue={car.power ?? ""}
            />
          </div>
          <div className="field">
            <label htmlFor="fuel">Combustível</label>
            <input id="fuel" name="fuel" defaultValue={car.fuel ?? ""} />
          </div>
          <div className="field">
            <label htmlFor="weight">Peso (kg)</label>
            <input
              id="weight"
              name="weight"
              type="number"
              min={0}
              defaultValue={car.weight ?? ""}
            />
          </div>
          <div className="field span-2">
            <label htmlFor="notes">Observações</label>
            <textarea id="notes" name="notes" rows={3} defaultValue={car.notes ?? ""} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button disabled={loading}>{loading ? "Salvando..." : "Salvar alterações"}</button>
          <Link href={`/cars/${encodeURIComponent(car.chassis)}`} className="btn secondary">
            Cancelar
          </Link>
          <button
            type="button"
            className="secondary"
            style={{ marginLeft: "auto", color: "var(--accent-hover)" }}
            disabled={loading}
            onClick={handleDelete}
          >
            Excluir carro
          </button>
        </div>
      </form>
    </>
  );
}
