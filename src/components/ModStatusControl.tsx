"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MOD_STATUSES, MOD_STATUS_LABELS } from "@/lib/constants";

export function ModStatusControl({
  carId,
  modId,
  status,
}: {
  carId: string;
  modId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function update(newStatus: string) {
    setLoading(true);
    await fetch(`/api/cars/${carId}/modifications/${modId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setLoading(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm("Remover esta modificação?")) return;
    setLoading(true);
    await fetch(`/api/cars/${carId}/modifications/${modId}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <span style={{ display: "inline-flex", gap: 6, marginLeft: "auto" }}>
      <select
        value={status}
        disabled={loading}
        onChange={(e) => update(e.target.value)}
        style={{ width: "auto", padding: "4px 8px", fontSize: 13 }}
      >
        {MOD_STATUSES.map((s) => (
          <option key={s} value={s}>
            {MOD_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="secondary small"
        disabled={loading}
        onClick={remove}
      >
        Remover
      </button>
    </span>
  );
}
