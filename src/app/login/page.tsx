"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.get("username"),
        password: form.get("password"),
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Erro ao entrar.");
      return;
    }
    router.push(`/verify?email=${encodeURIComponent(data.email ?? "")}`);
  }

  return (
    <main className="container">
      <div className="auth-card">
        <h1>Entrar</h1>
        <p className="subtitle">
          Etapa 1 de 2 — informe usuário e senha. Em seguida enviaremos um
          código de segurança ao seu e-mail.
        </p>
        {error && <div className="error-box">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="username">Nome de usuário</label>
            <input id="username" name="username" autoComplete="username" required />
          </div>
          <div className="field">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <button className="full-width" disabled={loading}>
            {loading ? "Verificando..." : "Continuar"}
          </button>
        </form>
        <p className="subtitle" style={{ marginTop: 16, marginBottom: 0 }}>
          Não tem conta? <Link href="/register">Cadastre-se</Link>
        </p>
      </div>
    </main>
  );
}
