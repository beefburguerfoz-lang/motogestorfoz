import { Router } from "express";
import { getWhatsAppQrPngDataUrl, getWhatsAppStatus, initWhatsApp, logoutWhatsApp } from "./baileys";

const router = Router();

// inicia Baileys automaticamente no primeiro hit
router.use(async (_req, _res, next) => {
  await initWhatsApp();
  next();
});

router.get("/status", (_req, res) => {
  res.json(getWhatsAppStatus());
});

// Retorna PNG base64: { "dataUrl": "data:image/png;base64,..." }
router.get("/qr", (_req, res) => {
  const dataUrl = getWhatsAppQrPngDataUrl();
  res.json({ dataUrl });
});

router.post("/disconnect", async (_req, res) => {
  await logoutWhatsApp();
  res.json({ ok: true });
});

export default router;
