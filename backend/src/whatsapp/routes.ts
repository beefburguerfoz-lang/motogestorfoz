import { Router } from "express";
import {
  connectWhatsApp,
  disconnectWhatsApp,
  getWhatsAppCompanyBinding,
  getWhatsAppCompanyBindingFilePath,
  getWhatsAppQrPngDataUrl,
  getWhatsAppStatus,
  resetWhatsAppSession,
  setWhatsAppCompanyBinding,
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
  try {
    await connectWhatsApp();
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ ok: false, message: error?.message || "Falha ao conectar WhatsApp" });
  }
});

// força sessão nova para gerar QR quando a sessão antiga travar
router.post("/reset-session", async (_req, res) => {
  try {
    await resetWhatsAppSession();
    await connectWhatsApp();
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ ok: false, message: error?.message || "Falha ao resetar sessão WhatsApp" });
  }
});

// desconecta (painel chama isso)
router.post("/disconnect", async (_req, res) => {
  try {
    await disconnectWhatsApp();
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ ok: false, message: error?.message || "Falha ao desconectar WhatsApp" });
  }
});

// vínculo persistente da instância WhatsApp com empresa
router.get("/company-binding", (_req, res) => {
  res.json({ binding: getWhatsAppCompanyBinding(), filePath: getWhatsAppCompanyBindingFilePath() });
});

router.post("/company-binding", async (req, res) => {
  const companyId = String(req.body?.companyId || req.body?.empresaId || "").trim();
  if (!companyId) {
    return res.status(400).json({ ok: false, message: "companyId obrigatório" });
  }

  try {
    const binding = await setWhatsAppCompanyBinding(companyId);
    return res.json({ ok: true, binding });
  } catch (error: any) {
    if (error?.message === "company_not_found") {
      return res.status(404).json({ ok: false, message: "Empresa não encontrada" });
    }
    return res.status(500).json({ ok: false, message: "Falha ao salvar vínculo" });
  }
});

// vínculo persistente da instância WhatsApp com empresa
router.get("/company-binding", (_req, res) => {
  res.json({ binding: getWhatsAppCompanyBinding(), filePath: getWhatsAppCompanyBindingFilePath() });
});

router.post("/company-binding", async (req, res) => {
  const companyId = String(req.body?.companyId || req.body?.empresaId || "").trim();
  if (!companyId) {
    return res.status(400).json({ ok: false, message: "companyId obrigatório" });
  }

  try {
    const binding = await setWhatsAppCompanyBinding(companyId);
    return res.json({ ok: true, binding });
  } catch (error: any) {
    if (error?.message === "company_not_found") {
      return res.status(404).json({ ok: false, message: "Empresa não encontrada" });
    }
    return res.status(500).json({ ok: false, message: "Falha ao salvar vínculo" });
  }
});

export default router;
