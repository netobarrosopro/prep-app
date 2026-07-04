# Prep App 🏁

Gerenciador de projetos de **carros preparados**, nos mais diversos níveis e
categorias homologadas pela **CBA** (Confederação Brasileira de Automobilismo),
além da categoria **Entusiasta** para projetos de rua/hobby.

## Funcionalidades

### Perfis de acesso
- **Dono**: cadastra seus carros, define a categoria, atribui um preparador e
  acompanha as modificações.
- **Preparador**: acessa os carros atribuídos a ele, atualiza a ficha técnica e
  registra as mudanças e adaptações realizadas.

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
- **Edição completa do cadastro**: o dono altera qualquer informação
  (inclusive o chassi); o preparador atualiza a ficha técnica.
- Categoria do projeto: **Turismo Nacional, Marcas, Stock Car, Fórmula,
  Protótipos, Arrancada, Rally, Velocidade na Terra, Drift, Autocross,
  Endurance, Clássicos** (CBA) ou **Entusiasta**.
- Registro de **mudanças e adaptações** por tipo — **Motorização, Estética**,
  Suspensão, Freios, Segurança e Outros — com status (Planejada, Em andamento,
  Concluída), custo e histórico de quem registrou.

## Stack

- [Next.js 15](https://nextjs.org/) (App Router, TypeScript)
- [Prisma](https://www.prisma.io/) + SQLite (troque o datasource para
  PostgreSQL/MySQL em produção)
- [jose](https://github.com/panva/jose) (JWT), [bcryptjs](https://github.com/dcodeIO/bcrypt.js),
  [nodemailer](https://nodemailer.com/)

## Como rodar

```bash
# 1. Instale as dependências
npm install

# 2. Configure o ambiente
cp .env.example .env
# edite o .env: defina SESSION_SECRET (openssl rand -base64 32)
# e, opcionalmente, o SMTP para envio real dos códigos MFA

# 3. Crie o banco de dados
npm run db:push

# 4. Inicie em desenvolvimento
npm run dev
```

Acesse `http://localhost:3000`.

> **Dica (desenvolvimento):** sem SMTP configurado, o código MFA é exibido no
> console do servidor (`[DEV] Código MFA para ...`).

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
