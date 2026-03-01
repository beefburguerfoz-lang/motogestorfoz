# Moto Gestor - Logística Ágil 🏍️

Plataforma SaaS simplificada para empresas de motofrete gerenciarem pedidos e entregadores com integração via WhatsApp.

## 🚀 Tecnologias
- **Frontend**: React 19, Tailwind CSS, Lucide React, Recharts.
- **Backend**: Node.js, Express, Prisma ORM, PostgreSQL.
- **Infraestrutura**: Docker, Nginx (Proxy Reverso), PM2, GitHub Actions (CI/CD).

## 📂 Estrutura do Projeto
- `/` - Root: Configurações globais e Frontend (Vite).
- `/backend` - API REST e integração com Banco de Dados.
- `/infra` - Scripts de automação (Backups, Logrotate).
- `.github/workflows` - Automação de Build e Deploy.

## 🛠️ Guia de Instalação (Desenvolvimento)

1. **Backend**:
   ```bash
   cd backend
   npm install
   npx prisma generate
   npm run dev
   ```

2. **Frontend**:
   ```bash
   npm install
   npm run dev
   ```

## 🌐 Deploy em Produção (VPS)

### 1. Pré-requisitos
```bash
sudo apt update && sudo apt install -y nginx certbot docker docker-compose nodejs npm
sudo npm install -g pm2
```

### 2. Stack de Dados e API
```bash
docker-compose up -d --build
```

### 3. Servidor Web (Nginx)
Copie o arquivo `nginx.conf` para `/etc/nginx/sites-available/motogestor.conf` e ative o SSL:
```bash
sudo ln -s /etc/nginx/sites-available/motogestor.conf /etc/nginx/sites-enabled/
sudo certbot --nginx -d seu.dominio.com
```

## 🛡️ Manutenção e Monitoramento

- **Backups**: O script em `/infra/db-backup.sh` realiza dumps diários do PostgreSQL com retenção de 7 dias.
- **Logs**: Configurado via `logrotate` para evitar consumo excessivo de disco.
- **Health Check**: Monitore a saúde do sistema via `GET /api/health`.

---
*Moto Gestor - Eficiência em cada entrega.*