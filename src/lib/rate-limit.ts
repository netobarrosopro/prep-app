/**
 * Rate limiter simples em memória (janela deslizante) para endpoints sensíveis.
 * Em produção com múltiplas instâncias, substituir por Redis ou similar.
 */
const buckets = new Map<string, number[]>();

export function rateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): { ok: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const windowStart = now - windowMs;
  const timestamps = (buckets.get(key) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= maxAttempts) {
    const retryAfterSeconds = Math.ceil((timestamps[0] + windowMs - now) / 1000);
    return { ok: false, retryAfterSeconds };
  }

  timestamps.push(now);
  buckets.set(key, timestamps);

  // limpeza oportunista para não crescer indefinidamente
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => t <= windowStart)) buckets.delete(k);
    }
  }

  return { ok: true, retryAfterSeconds: 0 };
}
