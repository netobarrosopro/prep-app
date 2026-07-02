"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AssignPreparador({
  carId,
  current,
}: {
  carId: string;
  current?: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/cars/${carId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preparadorUsername: form.get("preparadorUsername") }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Erro ao atribuir preparador.");
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
      {error && <div className="error-box">{error}</div>}
      <div className="form-grid">
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="preparadorUsername">
            Atribuir preparador (deixe vazio para remover)
          </label>
          <input
            id="preparadorUsername"
            name="preparadorUsername"
            defaultValue={current ?? ""}
            placeholder="usuário do preparador"
          />
        </div>
        <div className="field" style={{ alignSelf: "end", marginBottom: 0 }}>
          <button className="secondary" disabled={loading}>
            {loading ? "Salvando..." : "Salvar preparador"}
          </button>
        </div>
      </div>
    </form>
  );
}
