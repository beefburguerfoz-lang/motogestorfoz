
import { logger } from "../config/logger";

const API_URL = process.env.WHATSAPP_API_URL;
const TOKEN = process.env.WHATSAPP_TOKEN;

/**
 * Envia mensagem de texto simples.
 */
export async function sendText(companyId: string, to: string, text: string) {
  logger.info({ companyId, to, text }, "WhatsApp: Enviando texto");
  
  // Em produção, usar fetch ou axios para o provider (Meta/Twilio/Z-API)
  /*
  await fetch(`${API_URL}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, text })
  });
  */
  
  return { success: true };
}

/**
 * Envia mensagem com botões interativos.
 */
export async function sendButtons(
  companyId: string, 
  to: string, 
  text: string, 
  buttons: { id: string; label: string }[]
) {
  logger.info({ companyId, to, text, buttons }, "WhatsApp: Enviando botões");
  
  // Simulação de payload de botões (Formato padrão Meta/WhatsApp Cloud API)
  return { success: true };
}
