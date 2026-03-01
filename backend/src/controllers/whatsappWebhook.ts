import { Request, Response } from "express";
import { logger } from "../config/logger";
import { processIncomingBotMessage } from "../services/botPipelineService";

export default async function whatsappWebhook(req: Request, res: Response) {
  try {
    const { empresaId, from, text, buttonId } = parsePayload(req.body);
    if (!empresaId || !from) return res.sendStatus(400);

    await processIncomingBotMessage({ empresaId, from, text, buttonId });
    return res.sendStatus(200);
  } catch (error) {
    logger.error(error, "Erro no Webhook");
    return res.sendStatus(500);
  }
}

function parsePayload(body: any) {
  return {
    empresaId: body.empresaId || body.companyId || process.env.DEFAULT_COMPANY_ID,
    from: body.from || body.phone || body.message?.from || "",
    text: body.text || body.message?.body || body.message?.text || "",
    buttonId: body.buttonId || body.message?.buttonId || null
  };
}
