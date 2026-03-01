# README_DEPLOY — MotoGestor

## 1) Pré-deploy (ambiente controlado)

1. Backend build:
   - `npm --prefix backend run build`
2. Frontend build:
   - `npm --prefix frontend run build`
3. Verificar PM2 aponta para `backend/dist/src/index.js`.
4. Verificar Nginx proxy:
   - `/` -> frontend estático
   - `/api` -> backend porta `4000`
5. Garantir variáveis de ambiente:
   - Backend: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `DEFAULT_COMPANY_ID` (opcional, mas recomendado para entrada Baileys direta), `GOOGLE_API_KEY`.
   - Frontend: `VITE_API_URL` (ex.: `/api` com proxy, ou `https://dominio/api`).

## 2) Deploy backend

```bash
cd backend
npm ci
npm run build
pm2 startOrReload pm2.ecosystem.config.js --update-env
pm2 save
```

## 3) Deploy frontend

```bash
cd frontend
npm ci
npm run build
# publicar conteúdo de frontend/dist no diretório servido pelo Nginx
```

## 4) Validação pós-deploy

1. `GET /api/health`
2. `GET /api/whatsapp/status`
3. Login no painel e validar conexão websocket.
4. Fluxo WhatsApp:
   - conectar sessão
   - ler QR
   - receber mensagem de cliente
   - criar corrida
   - despacho para motoboy

## 5) Checklist de estabilidade VPS

- PM2 sem loop de reinício.
- Apenas backend em `:4000`.
- Nginx ativo com proxy de websocket.
- Frontend estático servido corretamente.
- Socket.io autenticando e cliente entrando na sala da empresa.
