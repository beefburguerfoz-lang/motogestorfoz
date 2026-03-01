
import { logger } from "../config/logger";

/**
 * Serviço de integração com a API do WhatsApp.
 * No estágio atual, funciona como um placeholder para futuras integrações.
 */
export async function sendWhatsAppMessage(to: string, text: string) {
  const token = process.env.WHATSAPP_TOKEN;

  logger.info({ to, messageLength: text.length, tokenConfigured: !!token }, 'Simulando envio de mensagem WhatsApp');

  // Placeholder: Logamos a intenção de envio
  /*
  const response = await fetch('https://graph.facebook.com/v17.0/YOUR_PHONE_ID/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to,
      type: "text",
      text: { body: text }
    })
  });
  return response.ok;
  */

  return { ok: true, timestamp: new Date().toISOString() };
}
