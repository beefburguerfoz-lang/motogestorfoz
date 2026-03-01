# Troubleshooting — MotoGestor

## WhatsApp não conecta

- Verificar `GET /api/whatsapp/status`:
  - `connected=false`, `connecting=false`, `desired=false`: faltou chamar `POST /api/whatsapp/connect`.
  - `lastError` preenchido: revisar sessão `.wa-session` e conectividade.
- Verificar `DEFAULT_COMPANY_ID` quando entrada vier direto do Baileys (sem webhook multiempresa).

## QR não aparece

- Verificar `GET /api/whatsapp/qr` retornando `dataUrl`.
- Verificar frontend acessando `VITE_API_URL` correto.
- Confirmar CORS/Proxy Nginx para `/api/whatsapp/*`.

## Corrida criada via bot com campos vazios

- Validar que sessão contém `pickup`, `destination` e `price`.
- Conferir logs de `createOrderFromSession` e `botPipelineService`.

## Corrida não chega em tempo real no painel

- Verificar token em `localStorage` (`mg_token`).
- Verificar handshake socket autenticado.
- Verificar `join_company` após conectar socket.
- Verificar emissão de eventos `ORDER_CREATED` e `ORDER_UPDATED` no backend.

## Dispatch para na primeira falha

- Verificar logs de `dispatchService` por motoboy.
- Motoboy sem telefone válido agora é pulado, sem abortar fila.

## Google API falhando

- Confirmar `GOOGLE_API_KEY`.
- Se indisponível, serviço usa fallback mock controlado para não quebrar fluxo.
