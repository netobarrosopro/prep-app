#!/usr/bin/env bash
# Atualiza o app em produção para a versão mais recente do repositório.
# Execute na instância EC2:  bash deploy/update.sh
set -euo pipefail

cd "$(dirname "$0")/.."
git pull
npm ci
npx prisma db push
npm run build
sudo systemctl restart prep-app
echo "Atualizado. Logs: sudo journalctl -u prep-app -f"
