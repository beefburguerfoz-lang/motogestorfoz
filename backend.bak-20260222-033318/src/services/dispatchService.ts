import { prisma } from "./prismaClient";
import { sendButtons, sendText } from "./whatsappService";
import { eventService, EVENTS } from "./eventService";
import { logger } from "../config/logger";

const ATTEMPT_TIMEOUT_MS = 30000;

export async function dispatchOrder(orderId: string) {
  try {
    const order = await prisma.corrida.findUnique({ 
      where: { id: orderId },
      include: { empresa: true }
    });

    if (!order) {
      logger.error({ orderId }, "Corrida não encontrada para despacho");
      return;
    }

    const riders = await prisma.motoboy.findMany({
      where: { 
        empresaId: order.empresaId, 
        ativo: true,
        deletedAt: null
      }
    });

    if (riders.length === 0) {
      logger.warn({ orderId }, "Nenhum motoboy disponível no momento.");
      return;
    }

    for (const rider of riders) {
      const currentOrder = await prisma.corrida.findUnique({ where: { id: orderId } });
      if (currentOrder?.status !== "PENDENTE" || currentOrder?.motoboyId) {
        return;
      }

      const encodedDest = encodeURIComponent(order.enderecoEntrega ?? "");
      const mapsLink = `https://www.google.com/maps/dir/?api=1&destination=${encodedDest}`;

      const msg = `📦 *Nova Corrida Disponível!*\n\n` +
                 `📍 Retirada: ${order.enderecoRetirada ?? "—"}\n` +
                 `🏁 Entrega: ${order.enderecoEntrega ?? "—"}\n` +
                 `💰 Ganhos: *R$ ${(((order.valor ?? 0) * 0.8)).toFixed(2)}*\n\n` +
                 `🗺️ *Ver Rota:* ${mapsLink}\n\n` +
                 `Deseja aceitar esta entrega?`;

      await sendButtons(order.empresaId, rider.telefone ?? "", msg, [
        { id: `ACCEPT_${orderId}_${rider.id}`, label: "✅ ACEITAR" },
        { id: `REFUSE_${orderId}_${rider.id}`, label: "❌ RECUSAR" }
      ]);

      const result = await waitRiderResponse(orderId, rider.id, ATTEMPT_TIMEOUT_MS);

      if (result === "accepted") {
        logger.info({ orderId, riderId: rider.id }, "Motoboy aceitou a corrida.");
        return { success: true, riderId: rider.id };
      }
    }

    await sendText(order.empresaId, order.clienteTelefone ?? "", 
      "⚠️ Todos os nossos motoboys estão ocupados. Continuaremos tentando!"
    );

  } catch (error) {
    logger.error({ error, orderId }, "Erro no serviço de despacho");
  }
}

function waitRiderResponse(orderId: string, riderId: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      eventService.removeListener(EVENTS.RIDER_RESPONSE, listener);
      resolve("timeout");
    }, timeoutMs);

    const listener = (payload: any) => {
      if (payload.orderId === orderId && payload.riderId === riderId) {
        clearTimeout(timeout);
        eventService.removeListener(EVENTS.RIDER_RESPONSE, listener);
        resolve(payload.status);
      }
    };

    eventService.on(EVENTS.RIDER_RESPONSE, listener);
  });
}
