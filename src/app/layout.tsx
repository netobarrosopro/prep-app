import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { ROLE_LABELS } from "@/lib/constants";
import { LogoutButton } from "@/components/LogoutButton";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prep App — Gerenciador de carros preparados",
  description:
    "Gerencie projetos de carros preparados nas categorias homologadas pela CBA e Entusiasta.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Prep App",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0d1017",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <html lang="pt-BR">
      <body>
        <header className="site-header">
          <Link href={session ? "/dashboard" : "/"} className="logo">
            PREP<span>APP</span>
          </Link>
          <nav>
            {session ? (
              <>
                <span>
                  {session.username} · {ROLE_LABELS[session.role]}
                </span>
                <LogoutButton />
              </>
            ) : (
              <>
                <Link href="/login">Entrar</Link>
                <Link href="/register">Criar conta</Link>
              </>
            )}
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
