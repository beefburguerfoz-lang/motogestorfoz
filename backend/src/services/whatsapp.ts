import { logger } from "../config/logger";
import { sendBaileysText } from "../whatsapp/baileys";

/**
 * Serviço legado para envio de mensagem WhatsApp.
 * Mantido por compatibilidade e agora integrado ao Baileys real.
 */
export async function sendWhatsAppMessage(to: string, text: string) {
  logger.info({ to, messageLength: text.length }, "Enviando mensagem WhatsApp (Baileys)");
  await sendBaileysText(to, text);
  return { ok: true, timestamp: new Date().toISOString() };
}
