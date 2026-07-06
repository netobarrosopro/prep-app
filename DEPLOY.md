# Guia de hospedagem — prepapp.spoondata.com.br

Arquitetura (a mais barata possível dentro do free tier da AWS):

```
Celular / Navegador
        │  HTTPS (TLS da Cloudflare)
        ▼
Cloudflare (DNS + Tunnel)  ← domínio spoondata.com.br
        │  túnel de saída (sem porta aberta no EC2)
        ▼
EC2 t3.micro (sa-east-1) — Node.js 22 + Next.js via systemd
        │  porta 5432, somente dentro da VPC
        ▼
RDS PostgreSQL db.t3.micro (sa-east-1)

E-mails do MFA: Amazon SES (SMTP)
```

**Custo estimado**: R$ 0 nos 12 meses de free tier (750 h/mês de EC2 t3.micro,
750 h/mês de RDS db.t3.micro, 20 GB de armazenamento). Depois do free tier,
~US$ 25–30/mês na sa-east-1. SES: ~US$ 0,10 por mil e-mails. Cloudflare: grátis.

> Faça as partes na ordem. Tempo total estimado: 1h30.

---

## Parte 1 — RDS PostgreSQL

1. Console AWS → confira a região no topo direito: **São Paulo (sa-east-1)**.
2. Procure **RDS** → **Create database**.
3. Escolha:
   - **Standard create** → Engine: **PostgreSQL** (versão 16.x)
   - **Templates**: **Free tier** (isso já trava a instância em db.t3.micro/db.t4g.micro)
   - **DB instance identifier**: `prepapp-db`
   - **Master username**: `prepapp`
   - **Master password**: gere uma senha forte e **anote** (ex.: use um gerenciador de senhas)
   - **Storage**: 20 GB gp3, desmarque *storage autoscaling* (evita custo surpresa)
   - **Connectivity**:
     - VPC: a *default* está ok
     - **Public access: No** (o banco só será acessível de dentro da VPC)
     - VPC security group: **Create new** → nome `prepapp-db-sg`
   - **Additional configuration** → **Initial database name**: `prepapp`
     (não pule; sem isso o banco "prepapp" não é criado)
4. **Create database** e aguarde ~10 min até o status **Available**.
5. Clique na instância e **anote o Endpoint** (algo como
   `prepapp-db.xxxxxxxx.sa-east-1.rds.amazonaws.com`).

## Parte 2 — EC2 (servidor do app)

1. Console AWS → **EC2** → **Launch instance**:
   - **Name**: `prepapp-server`
   - **AMI**: **Ubuntu Server 24.04 LTS (64-bit x86)**
   - **Instance type**: **t3.micro** (marcado *Free tier eligible*)
   - **Key pair**: crie um (`prepapp-key`), baixe o `.pem` e guarde
   - **Network settings** → **Edit**:
     - Auto-assign public IP: **Enable**
     - Security group: **Create** → nome `prepapp-server-sg`
     - Regra de entrada: **apenas SSH (22)** com Source **My IP**
       (não abra 80/443 — o Cloudflare Tunnel dispensa porta pública)
   - **Storage**: 20 GB gp3
2. **Launch instance** e anote o **IPv4 público**.
3. Libere o acesso do EC2 ao banco:
   - EC2 → Security Groups → `prepapp-db-sg` → **Edit inbound rules** →
     **Add rule**: Type **PostgreSQL (5432)**, Source **Custom** →
     selecione o security group `prepapp-server-sg` → Save.

### 2.1 Instalar o app no EC2

Conecte por SSH (no Windows use o PowerShell; `cd` até a pasta do `.pem`):

```bash
ssh -i prepapp-key.pem ubuntu@IP-PUBLICO-DO-EC2
```

Dentro da instância:

```bash
sudo apt-get update && sudo apt-get install -y git
git clone https://github.com/netobarrosopro/prep-app.git
cd prep-app
git checkout claude/car-project-manager-26wkd7   # ou main, após o merge
```

> Se o repositório for privado, gere um *Personal Access Token* no GitHub
> (Settings → Developer settings → Fine-grained tokens, permissão de leitura
> em Contents) e clone com:
> `git clone https://SEU_TOKEN@github.com/netobarrosopro/prep-app.git`

Crie o `.env` de produção:

```bash
cp .env.example .env
nano .env
```

Preencha (troque `SENHA` e o endpoint pelos anotados na Parte 1):

```env
DATABASE_URL="postgresql://prepapp:SENHA@prepapp-db.xxxxxxxx.sa-east-1.rds.amazonaws.com:5432/prepapp?sslmode=require"
SESSION_SECRET="<saída de: openssl rand -base64 32>"
SMTP_HOST=""        # preencha na Parte 4 (SES)
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="Prep App <no-reply@spoondata.com.br>"
```

Rode o script de preparação (instala Node 22, swap, build e o serviço):

```bash
bash deploy/setup-ec2.sh
```

Ao final deve aparecer `active (running)`. Teste de dentro da instância:

```bash
curl -s http://localhost:3000/login | head -c 200   # deve trazer HTML
```

## Parte 3 — Domínio na Cloudflare (Tunnel)

O Cloudflare Tunnel conecta o EC2 à Cloudflare **de dentro para fora** — sem
abrir porta no firewall e sem gerenciar certificado (o HTTPS é da Cloudflare).

1. [dash.cloudflare.com](https://dash.cloudflare.com) → menu lateral
   **Zero Trust** (se pedir, conclua o onboarding gratuito).
2. **Networks → Tunnels → Create a tunnel** → tipo **Cloudflared**.
3. Nome: `prepapp` → **Save tunnel**.
4. Na tela "Install and run a connector", escolha **Debian / 64-bit** e copie
   o bloco de comandos (contém o token do túnel). Cole **no SSH do EC2**.
   Confirme na página: o conector deve aparecer como **Connected**.
5. Avance para **Route tunnel** (aba *Public Hostnames* → *Add a public hostname*):
   - **Subdomain**: `prepapp` — **Domain**: `spoondata.com.br`
   - **Service**: Type **HTTP** — URL `localhost:3000`
   - Save. (O registro DNS `prepapp` é criado automaticamente, já proxied.)
6. Cloudflare → site `spoondata.com.br` → **SSL/TLS**: confirme o modo
   **Full** (ou Full strict). Em **Edge Certificates**, ative
   **Always Use HTTPS**.

Teste no navegador: `https://prepapp.spoondata.com.br` → deve abrir a tela de
login. (O cadastro já funciona; o e-mail do MFA só chega após a Parte 4 —
até lá o código aparece nos logs: `sudo journalctl -u prep-app -f`.)

## Parte 4 — Amazon SES (e-mail do MFA)

1. Console AWS (região **sa-east-1**) → **Amazon SES** → **Identities** →
   **Create identity** → **Domain** → `spoondata.com.br`.
2. O SES mostra ~3 registros **DKIM (CNAME)**. Na Cloudflare → site
   `spoondata.com.br` → **DNS → Records**, crie cada CNAME **com o proxy
   DESLIGADO (nuvem cinza — "DNS only")**. Aguarde o status **Verified**
   no SES (minutos até algumas horas).
3. SES → **SMTP settings** → **Create SMTP credentials** → anote o
   **SMTP username** e **SMTP password** gerados.
4. No EC2, edite o `.env` (`nano .env`):

```env
SMTP_HOST="email-smtp.sa-east-1.amazonaws.com"
SMTP_PORT="587"
SMTP_USER="<SMTP username>"
SMTP_PASS="<SMTP password>"
SMTP_FROM="Prep App <no-reply@spoondata.com.br>"
```

```bash
sudo systemctl restart prep-app
```

5. **Sandbox**: contas novas do SES só enviam para e-mails verificados.
   Para testar já: SES → Identities → Create identity → **Email address** →
   `netobarroso.pro@gmail.com` → clique no link de confirmação que chegar.
   Para liberar envio a qualquer destinatário: SES → **Account dashboard** →
   **Request production access** (formulário simples; aprovação em ~24 h —
   descreva que é um app de gestão de carros preparados enviando códigos de
   verificação de login).

## Parte 5 — Validação final

1. `https://prepapp.spoondata.com.br` → **Criar conta** (Dono) com seu e-mail.
2. Login → o código MFA deve chegar **por e-mail** (SES).
3. Cadastre um carro, registre uma modificação.
4. No celular: abra o endereço no Chrome → menu → **Adicionar à tela inicial**
   (PWA), ou gere o app Android apontando para produção:

```bash
CAP_SERVER_URL="https://prepapp.spoondata.com.br" npm run mobile:sync
npm run mobile:open
```

## Atualizações futuras

Depois de cada mudança no código (push para o GitHub), no SSH do EC2:

```bash
cd ~/prep-app && bash deploy/update.sh
```

## Problemas comuns

| Sintoma | Causa provável / correção |
|---|---|
| `prisma db push` trava ou dá timeout | Security group do RDS sem a regra vindo do `prepapp-server-sg` (Parte 2.3) |
| Erro 502 no domínio | App parado (`sudo systemctl status prep-app`) ou túnel desconectado (`sudo systemctl status cloudflared`) |
| E-mail não chega | SES em sandbox e destinatário não verificado (Parte 4.5), ou DKIM pendente |
| Build falha por falta de memória | Swap não criado — rode de novo o `deploy/setup-ec2.sh` |
| Cadastro dá "sessão inválida" | Cookie antigo de outro banco — clique em Sair e faça login de novo |
