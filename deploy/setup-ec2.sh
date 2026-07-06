#!/usr/bin/env bash
# Prepara uma instância EC2 Ubuntu 24.04 para rodar o Prep App.
# Execute como usuário ubuntu:  bash deploy/setup-ec2.sh
set -euo pipefail

echo "==> 1/4 Swap de 2 GB (necessário para o build em instâncias de 1 GB RAM)"
if ! swapon --show | grep -q /swapfile; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab > /dev/null
fi

echo "==> 2/4 Node.js 22 (NodeSource)"
if ! command -v node > /dev/null || [[ "$(node -v)" != v22* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
node -v && npm -v

echo "==> 3/4 Dependências e build do app"
cd "$(dirname "$0")/.."
if [[ ! -f .env ]]; then
  echo "ERRO: crie o arquivo .env antes (copie de .env.example e preencha" \
       "DATABASE_URL do RDS, SESSION_SECRET e SMTP_* do SES)."
  exit 1
fi
npm ci
npx prisma db push   # cria/atualiza as tabelas no RDS
npm run build

echo "==> 4/4 Serviço systemd"
sudo cp deploy/prep-app.service /etc/systemd/system/prep-app.service
sudo systemctl daemon-reload
sudo systemctl enable --now prep-app
sleep 3
sudo systemctl --no-pager status prep-app | head -10

echo
echo "Pronto! O app está rodando em http://localhost:3000 nesta instância."
echo "Próximo passo: conectar o Cloudflare Tunnel (ver DEPLOY.md, Parte 5)."
