"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { jsonRequest } from "@/lib/client";

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
    const result = await jsonRequest(`/api/cars/${carId}`, "PATCH", {
      preparadorUsername: form.get("preparadorUsername"),
    });
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
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
