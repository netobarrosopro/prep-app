import type { CapacitorConfig } from "@capacitor/cli";

/**
 * O app nativo é uma casca (WebView) que carrega o servidor Next.js.
 *
 * Defina a URL do servidor via variável de ambiente ao sincronizar:
 *   CAP_SERVER_URL="https://seu-dominio.com" npx cap sync android
 *
 * Padrões úteis para teste:
 *  - Emulador Android:  http://10.0.2.2:3000  (endereço do host visto de dentro do emulador)
 *  - Celular físico:    http://IP-DA-SUA-MAQUINA:3000  (mesma rede Wi-Fi)
 */
const serverUrl = process.env.CAP_SERVER_URL ?? "http://10.0.2.2:3000";

const config: CapacitorConfig = {
  appId: "br.com.prepapp",
  appName: "Prep App",
  webDir: "capacitor-shell",
  server: {
    url: serverUrl,
    // Permite HTTP sem TLS apenas para testes locais; em produção use HTTPS
    cleartext: serverUrl.startsWith("http://"),
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
