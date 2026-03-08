import { logger } from "../config/logger";
import { sendBaileysList, sendBaileysText } from "../whatsapp/baileys";

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

  try {
    logger.info({ companyId, to, uiType: "list", optionCount: buttons.length }, "WhatsApp: Tentando listMessage");
    return await sendBaileysList(to, text, buttons);
  } catch (listError) {
    logger.warn(
      { companyId, to, uiType: "text", reason: "list_failed", listError },
      "WhatsApp: Falha ao enviar listMessage; usando fallback textual visível"
    );
    return sendBaileysText(to, visibleOptionsText);
  }
}
