"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MOD_STATUSES, MOD_STATUS_LABELS } from "@/lib/constants";
import { jsonRequest } from "@/lib/client";

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
    const result = await jsonRequest(`/api/cars/${carId}/modifications/${modId}`, "PATCH", {
      status: newStatus,
    });
    setLoading(false);
    if (!result.ok) alert(result.error);
    router.refresh();
  }

  async function remove() {
    if (!confirm("Remover esta modificação?")) return;
    setLoading(true);
    const result = await jsonRequest(`/api/cars/${carId}/modifications/${modId}`, "DELETE");
    setLoading(false);
    if (!result.ok) alert(result.error);
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
