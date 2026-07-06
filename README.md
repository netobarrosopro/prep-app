# Prep App 🏁

Gerenciador de projetos de **carros preparados**, nos mais diversos níveis e
categorias homologadas pela **CBA** (Confederação Brasileira de Automobilismo),
além da categoria **Entusiasta** para projetos de rua/hobby.

## Funcionalidades

### Perfis de acesso
- **Dono**: cadastra seus carros, define a categoria, atribui um preparador e
  acompanha as modificações.
- **Preparador**: acessa os carros atribuídos a ele e registra as mudanças e
  adaptações realizadas (não edita os dados do cadastro do carro).

### Segurança (duplo fator de autenticação)
- Login em duas etapas: **usuário + senha** e, em seguida, **código de
  segurança (MFA) de 6 dígitos enviado ao e-mail cadastrado**.
- Senhas com hash **bcrypt** (12 rounds); códigos MFA também armazenados apenas
  como hash, com expiração de 10 minutos e máximo de 5 tentativas.
- Sessão em cookie **httpOnly** assinado (JWT HS256), com `SameSite=Lax` e
  `Secure` em produção.
- **Rate limiting** nos endpoints de registro, login e verificação.
- Mensagens de erro genéricas para evitar enumeração de usuários.

### Carros e modificações
- Cadastro do carro por **marca, modelo, ano, placa, cor** e ficha
  técnica (motor, potência, combustível, peso), com o **chassi como chave
  primária** (identificador único do carro).
- **Edição do cadastro somente pelo dono**: o dono altera qualquer informação
  (inclusive o chassi); o preparador não edita os dados do carro.
- Categoria do projeto: **Turismo Nacional, Marcas, Stock Car, Fórmula,
  Protótipos, Arrancada, Rally, Velocidade na Terra, Drift, Autocross,
  Endurance, Clássicos** (CBA) ou **Entusiasta**.
- Registro de **mudanças e adaptações** por tipo — **Motorização, Estética**,
  Suspensão, Freios, Segurança e Outros — com status (Planejada, Em andamento,
  Concluída), custo e histórico de quem registrou.

## Stack

- [Next.js 15](https://nextjs.org/) (App Router, TypeScript)
- [Prisma](https://www.prisma.io/) + PostgreSQL (Docker local em dev,
  Amazon RDS em produção — ver [DEPLOY.md](DEPLOY.md))
- [jose](https://github.com/panva/jose) (JWT), [bcryptjs](https://github.com/dcodeIO/bcrypt.js),
  [nodemailer](https://nodemailer.com/)

## Como rodar

```bash
# 1. Instale as dependências
npm install

# 2. Suba o PostgreSQL local (Docker)
docker compose up -d db

# 3. Configure o ambiente
cp .env.example .env
# edite o .env: defina SESSION_SECRET (openssl rand -base64 32)
# e, opcionalmente, o SMTP para envio real dos códigos MFA

# 4. Crie as tabelas
npm run db:push

# 5. Inicie em desenvolvimento
npm run dev
```

> Sem Docker? Aponte o `DATABASE_URL` para qualquer PostgreSQL 14+ (local ou
> na nuvem). Para produção, siga o **[guia de hospedagem](DEPLOY.md)**
> (AWS EC2 + RDS + Cloudflare).

Acesse `http://localhost:3000`.

> **Dica (desenvolvimento):** sem SMTP configurado, o código MFA é exibido no
> console do servidor (`[DEV] Código MFA para ...`).

## Rodando no Android (Capacitor)

O app nativo é uma casca (WebView via [Capacitor](https://capacitorjs.com))
que carrega o servidor Next.js — o projeto Android já está gerado em
`android/`. Também é um **PWA** (manifesto + ícone), instalável direto do
navegador do celular.

### Pré-requisitos
- [Android Studio](https://developer.android.com/studio) (inclui SDK e emulador)
- JDK 17+ (o Android Studio já traz)

### Testar no emulador

```bash
npm install
npm run dev            # servidor Next.js na porta 3000 (deixe rodando)
npm run mobile:sync    # sincroniza a configuração no projeto Android
npm run mobile:open    # abre o projeto no Android Studio
```

No Android Studio, clique em **Run** ▶ com um emulador criado. O app abre
apontando para `http://10.0.2.2:3000` (endereço da sua máquina visto de
dentro do emulador) — já é o padrão.

### Testar em um celular físico

1. Celular e computador na **mesma rede Wi-Fi**; descubra o IP da máquina
   (`ipconfig` / `ifconfig`, ex.: `192.168.0.10`).
2. Sincronize apontando para esse IP e rode no aparelho (modo desenvolvedor
   + depuração USB ativados):

```bash
CAP_SERVER_URL="http://192.168.0.10:3000" npm run mobile:sync
npm run mobile:open
```

> **MFA no celular:** sem SMTP configurado, o código continua saindo no
> console do servidor (`npm run dev`). Para receber por e-mail de verdade,
> preencha as variáveis `SMTP_*` no `.env`.

### Caminho para as lojas

1. **Hospede o servidor** com HTTPS (Vercel, Railway etc.) e troque o SQLite
   por PostgreSQL/MySQL no `prisma/schema.prisma` (SQLite é só para dev).
2. Sincronize com a URL pública: `CAP_SERVER_URL="https://seu-dominio.com" npm run mobile:sync`.
3. **Google Play**: no Android Studio, *Build → Generate Signed App Bundle*
   (AAB), crie a conta no [Play Console](https://play.google.com/console)
   (taxa única de US$ 25) e envie primeiro para *teste interno*.
4. **App Store (iOS)**: requer um Mac com Xcode. Rode
   `npm install @capacitor/ios && npx cap add ios && npx cap open ios`,
   assine com sua conta do [Apple Developer Program](https://developer.apple.com)
   (US$ 99/ano) e distribua primeiro via TestFlight.

## Fluxo de uso

1. Crie uma conta de **Dono** e outra de **Preparador** (`/register`).
2. Faça login (usuário + senha) e confirme o **código MFA** recebido por e-mail.
3. Como Dono, cadastre um carro e atribua o usuário do Preparador.
4. Ambos registram e acompanham as modificações de motorização, estética etc.

## Estrutura

```
prisma/schema.prisma        # User, MfaCode, Car, Modification
src/lib/                    # auth, sessão JWT, mailer, rate limit, constantes
src/app/api/auth/           # register, login, verify (MFA), logout
src/app/api/cars/           # CRUD de carros e modificações
src/app/(páginas)           # login, register, verify, dashboard, cars/*
src/middleware.ts           # proteção das rotas autenticadas
```
