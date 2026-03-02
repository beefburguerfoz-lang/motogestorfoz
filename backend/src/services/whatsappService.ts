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

  const visibleOptionsText = `${text}\n\n${buttons.map((b) => `• ${b.label}`).join("\n")}`;

  if (buttons.length > 3) {
    logger.warn(
      { companyId, to, buttonCount: buttons.length },
      "WhatsApp: Mensagem com mais de 3 botões não é suportada; usando fallback textual visível"
    );
    return sendBaileysText(to, visibleOptionsText);
  }

  try {
    return await sendBaileysButtons(to, visibleOptionsText, buttons);
  } catch (error) {
    logger.warn({ companyId, to, error }, "WhatsApp: Falha ao enviar botões; usando fallback de texto discreto");
    return sendBaileysText(to, visibleOptionsText);
  }
}
