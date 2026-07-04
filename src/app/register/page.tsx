"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { jsonRequest } from "@/lib/client";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    if (form.get("password") !== form.get("passwordConfirm")) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const result = await jsonRequest("/api/auth/register", "POST", {
      username: form.get("username"),
      email: form.get("email"),
      password: form.get("password"),
      role: form.get("role"),
    });
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/login?registered=1");
  }

  return (
    <main className="container">
      <div className="auth-card">
        <h1>Criar conta</h1>
        <p className="subtitle">
          O código de segurança do login (MFA) será enviado ao e-mail cadastrado.
        </p>
        {error && <div className="error-box">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="role">Perfil</label>
            <select id="role" name="role" required defaultValue="DONO">
              <option value="DONO">Dono do carro</option>
              <option value="PREPARADOR">Preparador</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="username">Nome de usuário</label>
            <input
              id="username"
              name="username"
              autoComplete="username"
              pattern="[a-zA-Z0-9_.\-]{3,30}"
              title="3–30 caracteres: letras, números, ponto, hífen e underline"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="field">
            <label htmlFor="password">Senha (mínimo 8 caracteres)</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="passwordConfirm">Confirmar senha</label>
            <input
              id="passwordConfirm"
              name="passwordConfirm"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <button className="full-width" disabled={loading}>
            {loading ? "Cadastrando..." : "Criar conta"}
          </button>
        </form>
        <p className="subtitle" style={{ marginTop: 16, marginBottom: 0 }}>
          Já tem conta? <Link href="/login">Entrar</Link>
        </p>
      </div>
    </main>
  );
}
