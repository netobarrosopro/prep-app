"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MOD_TYPES, MOD_TYPE_LABELS, MOD_STATUSES, MOD_STATUS_LABELS } from "@/lib/constants";

export function ModificationForm({ carId }: { carId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const res = await fetch(`/api/cars/${carId}/modifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Erro ao registrar a modificação.");
      return;
    }
    formEl.reset();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error-box">{error}</div>}
      <div className="form-grid">
        <div className="field">
          <label htmlFor="mod-type">Tipo *</label>
          <select id="mod-type" name="type" required defaultValue="MOTORIZACAO">
            {MOD_TYPES.map((t) => (
              <option key={t} value={t}>
                {MOD_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="mod-status">Status</label>
          <select id="mod-status" name="status" defaultValue="PLANEJADA">
            {MOD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {MOD_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="field span-2">
          <label htmlFor="mod-title">Título *</label>
          <input
            id="mod-title"
            name="title"
            placeholder="Ex.: Instalação de turbina / Pintura personalizada"
            required
          />
        </div>
        <div className="field span-2">
          <label htmlFor="mod-description">Descrição</label>
          <textarea
            id="mod-description"
            name="description"
            rows={2}
            placeholder="Detalhes da mudança ou adaptação"
          />
        </div>
        <div className="field">
          <label htmlFor="mod-cost">Custo (R$)</label>
          <input id="mod-cost" name="cost" type="number" min={0} step="0.01" />
        </div>
      </div>
      <button disabled={loading}>
        {loading ? "Registrando..." : "+ Registrar modificação"}
      </button>
    </form>
  );
}
