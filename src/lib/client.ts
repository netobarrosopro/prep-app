"use client";

import type { FormEvent } from "react";

export type JsonResult =
  | { ok: true; data: Record<string, unknown> & { [key: string]: unknown } }
  | { ok: false; error: string };

/**
 * Requisição JSON resiliente para os formulários: nunca lança exceção,
 * sempre retorna { ok, data | error } — mesmo quando o servidor responde
 * algo que não é JSON (ex.: erro 500) ou a rede falha.
 */
export async function jsonRequest(
  url: string,
  method: string,
  body?: unknown
): Promise<JsonResult> {
  try {
    const res = await fetch(url, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return {
        ok: false,
        error:
          (data as { error?: string } | null)?.error ??
          `Erro inesperado no servidor (HTTP ${res.status}). Tente novamente.`,
      };
    }
    return { ok: true, data: (data ?? {}) as Record<string, unknown> };
  } catch {
    return {
      ok: false,
      error: "Falha de conexão com o servidor. Verifique sua rede e tente novamente.",
    };
  }
}

/** Sanitiza o chassi enquanto o usuário digita: maiúsculas, sem espaços/símbolos. */
export function sanitizeChassisInput(e: FormEvent<HTMLInputElement>) {
  const input = e.currentTarget;
  input.value = input.value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
}
