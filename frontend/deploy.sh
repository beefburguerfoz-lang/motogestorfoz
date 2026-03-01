
#!/bin/bash
# Script de Deploy - Moto Gestor

echo "🚀 Iniciando deploy do Moto Gestor..."

# Atualiza código fonte
git pull origin main

# Reconstroi e sobe os containers em background
docker-compose up -d --build

# Limpa imagens antigas/não utilizadas para economizar espaço
docker image prune -f

echo "✅ Deploy finalizado com sucesso! Sistema online."
