import { prisma } from "./prismaClient";
import { sendButtons, sendText } from "./whatsappService";
import { eventService, EVENTS } from "./eventService";
import { logger } from "../config/logger";
import { createDispatchToken } from "./dispatchTokenService";

const ATTEMPT_TIMEOUT_MS = 30000;

function isBagCompatible(cargoType: string | null | undefined, bagType: string | null | undefined) {
  if (!cargoType) return true;
  if (!bagType) return false;

  const bag = bagType.toLowerCase();
  const cargo = cargoType.toLowerCase();

  if (cargo === "frágil" || cargo === "fragil") return true;
  if (cargo === "pequena") return ["pequena", "média", "media", "grande"].includes(bag);
  if (cargo === "média" || cargo === "media") return ["média", "media", "grande"].includes(bag);
  if (cargo === "grande") return ["grande"].includes(bag);
  return true;
}

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
        deletedAt: null,
        status: "DISPONIVEL"
      }
    });

    const filteredRiders = riders.filter((r) => isBagCompatible(order.origem, r.tipoBag));

    if (filteredRiders.length === 0) {
      logger.warn({ orderId }, "Nenhum motoboy compatível/disponível no momento.");
      return;
    }

    for (const rider of filteredRiders) {
      try {
        const currentOrder = await prisma.corrida.findUnique({ where: { id: orderId } });
        if (currentOrder?.status !== "PENDENTE" || currentOrder?.motoboyId) {
          return;
        }

        if (!rider.telefone) {
          logger.warn({ orderId, riderId: rider.id }, "Motoboy sem telefone válido, pulando para o próximo");
          continue;
        }

        const encodedDest = encodeURIComponent(order.enderecoEntrega ?? "");
        const mapsLink = `https://www.google.com/maps/dir/?api=1&destination=${encodedDest}`;

        const acceptToken = createDispatchToken({ action: "ACCEPT", orderId, riderId: rider.id });
        const refuseToken = createDispatchToken({ action: "REFUSE", orderId, riderId: rider.id });

        const msg =
          `📦 *Nova Corrida Disponível!*\n\n` +
          `🆔 ID: ${orderId}\n` +
          `📍 Retirada: ${order.enderecoRetirada ?? "—"}\n` +
          `🏁 Entrega: ${order.enderecoEntrega ?? "—"}\n` +
          `📦 Mercadoria: ${order.origem ?? "Não informado"}\n` +
          `📝 Observação: ${order.destino ?? "Sem observação"}\n` +
          `💰 Ganhos: *R$ ${((order.valor ?? 0) * 0.8).toFixed(2)}*\n\n` +
          `🗺️ *Ver Rota:* ${mapsLink}\n\n` +
          `Deseja aceitar esta entrega?`;

        await sendButtons(order.empresaId, rider.telefone, msg, [
          { id: `DISPATCH_ACCEPT_${acceptToken}`, label: "✅ ACEITAR" },
          { id: `DISPATCH_REFUSE_${refuseToken}`, label: "❌ RECUSAR" }
        ]);

        await prisma.historicoStatusCorrida.create({
          data: { corridaId: orderId, status: "OFFERED" }
        });

        const result = await waitRiderResponse(orderId, rider.id, ATTEMPT_TIMEOUT_MS);

        if (result === "accepted") {
          logger.info({ orderId, riderId: rider.id }, "Motoboy aceitou a corrida.");
          return { success: true, riderId: rider.id };
        }
      } catch (error) {
        logger.error({ error, orderId, riderId: rider.id }, "Falha ao despachar para motoboy, tentando próximo da fila");
      }
    }

    await sendText(order.empresaId, order.clienteTelefone ?? "", "⚠️ Todos os nossos motoboys estão ocupados. Continuaremos tentando!");
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
