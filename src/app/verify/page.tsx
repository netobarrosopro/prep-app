"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: form.get("code") }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Erro ao verificar o código.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="auth-card">
      <h1>Código de segurança</h1>
      <p className="subtitle">
        Etapa 2 de 2 — digite o código de 6 dígitos enviado para{" "}
        <strong>{email || "o e-mail cadastrado"}</strong>. Ele expira em 10 minutos.
      </p>
      {error && <div className="error-box">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="code">Código</label>
          <input
            id="code"
            name="code"
            className="code-input"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            placeholder="••••••"
            autoComplete="one-time-code"
            autoFocus
            required
          />
        </div>
        <button className="full-width" disabled={loading}>
          {loading ? "Verificando..." : "Confirmar"}
        </button>
      </form>
      <p className="subtitle" style={{ marginTop: 16, marginBottom: 0 }}>
        Não recebeu? <Link href="/login">Refaça o login</Link> para receber um novo código.
      </p>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <main className="container">
      <Suspense>
        <VerifyForm />
      </Suspense>
    </main>
  );
}
