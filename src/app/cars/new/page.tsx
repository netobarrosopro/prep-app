"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/constants";
import { jsonRequest, sanitizeChassisInput } from "@/lib/client";

export default function NewCarPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const result = await jsonRequest(
      "/api/cars",
      "POST",
      Object.fromEntries(form.entries())
    );
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    const car = result.data.car as { chassis: string };
    router.push(`/cars/${encodeURIComponent(car.chassis)}`);
    router.refresh();
  }

  return (
    <main className="container">
      <div className="page-title">
        <h1>Cadastrar carro</h1>
      </div>
      {error && <div className="error-box">{error}</div>}
      <form onSubmit={handleSubmit} className="panel">
        <div className="form-grid">
          <div className="field">
            <label htmlFor="brand">Marca *</label>
            <input id="brand" name="brand" placeholder="Ex.: Chevrolet" required />
          </div>
          <div className="field">
            <label htmlFor="model">Modelo *</label>
            <input id="model" name="model" placeholder="Ex.: Opala SS" required />
          </div>
          <div className="field">
            <label htmlFor="year">Ano *</label>
            <input
              id="year"
              name="year"
              type="number"
              min={1900}
              max={new Date().getFullYear() + 1}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="category">Categoria *</label>
            <select id="category" name="category" required defaultValue="ENTUSIASTA">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="chassis">Chassi * (identificador único do carro)</label>
            <input
              id="chassis"
              name="chassis"
              placeholder="Ex.: 9BGKS19B0PB123456"
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
            <input id="plate" name="plate" placeholder="ABC1D23" />
          </div>
          <div className="field">
            <label htmlFor="color">Cor</label>
            <input id="color" name="color" />
          </div>
          <div className="field">
            <label htmlFor="preparadorUsername">Preparador (usuário)</label>
            <input
              id="preparadorUsername"
              name="preparadorUsername"
              placeholder="usuário do preparador (opcional)"
            />
          </div>
          <div className="field">
            <label htmlFor="engine">Motor</label>
            <input id="engine" name="engine" placeholder="Ex.: 4.1 12v turbo" />
          </div>
          <div className="field">
            <label htmlFor="power">Potência (cv)</label>
            <input id="power" name="power" type="number" min={0} />
          </div>
          <div className="field">
            <label htmlFor="fuel">Combustível</label>
            <input id="fuel" name="fuel" placeholder="Ex.: Etanol" />
          </div>
          <div className="field">
            <label htmlFor="weight">Peso (kg)</label>
            <input id="weight" name="weight" type="number" min={0} />
          </div>
          <div className="field span-2">
            <label htmlFor="notes">Observações</label>
            <textarea id="notes" name="notes" rows={3} />
          </div>
        </div>
        <button disabled={loading}>{loading ? "Salvando..." : "Cadastrar"}</button>
      </form>
    </main>
  );
}
