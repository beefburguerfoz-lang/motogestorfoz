import { logger } from "../config/logger";
import { sendBaileysButtons, sendBaileysList, sendBaileysText } from "../whatsapp/baileys";

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
      { companyId, to, uiType: "list", buttonCount: buttons.length },
      "WhatsApp: Mensagem com mais de 3 opções; enviando listMessage"
    );
    try {
      return await sendBaileysList(to, text, buttons);
    } catch (listError) {
      logger.warn(
        { companyId, to, uiType: "text", listError },
        "WhatsApp: Falha ao enviar listMessage; usando fallback textual visível"
      );
      return sendBaileysText(to, visibleOptionsText);
    }
  }

  try {
    logger.info({ companyId, to, uiType: "buttons", buttonCount: buttons.length }, "WhatsApp: Tentando buttonsMessage");
    return await sendBaileysButtons(to, text, buttons);
  } catch (error) {
    logger.warn(
      { companyId, to, uiType: "list", reason: "buttons_failed", error },
      "WhatsApp: Falha ao enviar buttonsMessage; tentando listMessage"
    );
    try {
      return await sendBaileysList(to, text, buttons);
    } catch (listError) {
      logger.warn(
        { companyId, to, uiType: "text", reason: "list_failed", listError },
        "WhatsApp: Falha ao enviar listMessage; usando fallback textual visível"
      );
      return sendBaileysText(to, visibleOptionsText);
    }
  }
}
