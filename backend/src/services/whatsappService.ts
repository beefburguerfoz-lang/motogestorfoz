import { logger } from "../config/logger";
import { sendBaileysButtons, sendBaileysText } from "../whatsapp/baileys";

/**
 * Envia mensagem de texto via sessão ativa do Baileys.
 */
export async function sendText(companyId: string, to: string, text: string) {
  logger.info({ companyId, to, text }, "WhatsApp: Enviando texto (Baileys)");
  return sendBaileysText(to, text);
}

/**
 * Envia mensagem com botões interativos via Baileys.
 */
export async function sendButtons(
  companyId: string,
  to: string,
  text: string,
  buttons: { id: string; label: string }[]
) {
  logger.info({ companyId, to, text, buttons }, "WhatsApp: Enviando botões (Baileys)");
  return sendBaileysButtons(to, text, buttons);
}
