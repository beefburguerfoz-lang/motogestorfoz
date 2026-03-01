import { prisma } from "../services/prismaClient";
import { logAudit } from "../services/auditService";
import { logger } from "../config/logger";
import { dispatchOrder } from "../services/dispatchService";
import { emitToCompany } from "../services/socketService";

/**
 * Cria um pedido real (Corrida) a partir dos dados acumulados em uma sessão de conversa.
 */
export async function createOrderFromSession(session: any, companyId: string, phone: string) {
  const data = session.data || {};
  
  try {
    const corrida = await prisma.corrida.create({
      data: {
        empresaId: companyId,
        clienteTelefone: phone,
        clienteNome: data.customerName || `Cliente ${phone.slice(-4)}`,
        valor: data.price || 0,
        enderecoRetirada: data.pickup?.formattedAddress || "Endereço não informado",
        bairroRetirada: data.pickup?.bairro || "Geral",
        enderecoEntrega: data.destination?.formattedAddress || "Endereço não informado",
        bairroEntrega: data.destination?.bairro || "Geral",
        status: "PENDENTE",
      }
    });

    // EMISSÃO EM TEMPO REAL PARA O DASHBOARD (Mantemos o evento para o front-end)
    emitToCompany(companyId, "ORDER_CREATED", corrida);

    await logAudit({
      action: "ORDER_CREATED_VIA_WA",
      entity: "CORRIDA",
      entityId: corrida.id,
      metadata: { sessionId: session.id, phone, valor: data.price }
    });

    logger.info({ orderId: corrida.id, companyId }, "Corrida criada via WA. Iniciando despacho...");

    dispatchOrder(corrida.id).catch(err => {
      logger.error({ err, orderId: corrida.id }, "Erro ao processar despacho em background");
    });

    return corrida;
  } catch (error) {
    logger.error({ error, phone, companyId }, "Falha ao converter sessão em corrida");
    throw error;
  }
}
