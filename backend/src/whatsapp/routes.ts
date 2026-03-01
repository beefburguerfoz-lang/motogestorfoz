import { Router } from "express";
import {
  connectWhatsApp,
  disconnectWhatsApp,
  getWhatsAppQrPngDataUrl,
  getWhatsAppStatus,
  resetWhatsAppSession,
} from "./baileys";

const router = Router();

// status
router.get("/status", (_req, res) => {
  res.json(getWhatsAppStatus());
});

// qr
router.get("/qr", (_req, res) => {
  res.json({ dataUrl: getWhatsAppQrPngDataUrl() });
});

// conecta (painel chama isso)
router.post("/connect", async (_req, res) => {
  await connectWhatsApp();
  res.json({ ok: true });
});

// força sessão nova para gerar QR quando a sessão antiga travar
router.post("/reset-session", async (_req, res) => {
  await resetWhatsAppSession();
  await connectWhatsApp();
  res.json({ ok: true });
});

// desconecta (painel chama isso)
router.post("/disconnect", async (_req, res) => {
  await disconnectWhatsApp();
  res.json({ ok: true });
});

export default router;
