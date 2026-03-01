import { prisma } from "./prismaClient";
import { logger } from "../config/logger";

export async function creditRider(
  riderId: string, 
  companyId: string, 
  amount: number, 
  meta?: any,
  externalTx?: any
) {
  const tx = externalTx || prisma;

  logger.info({ riderId, amount }, "Creditando saldo ao motoboy");

  await tx.motoboy.update({
    where: { id: riderId },
    data: {
      totalEarnings: { increment: amount },
      status: 'DISPONIVEL' 
    }
  });

  return { success: true };
}

export async function finalizeOrder(orderId: string, companyId: string) {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.corrida.findUnique({
      where: { id: orderId },
      include: { motoboy: true }
    });

    if (!order) throw new Error("order_not_found");
    if (!order.motoboyId) throw new Error("order_has_no_rider");
    if (order.status === "ENTREGUE") return order; 

    const riderShare = (order.valor ?? 0) * 0.8;

    const updatedOrder = await tx.corrida.update({
      where: { id: orderId },
      data: { 
        status: "ENTREGUE",
        updatedAt: new Date()
      }
    });

    await tx.historicoStatusCorrida.create({
      data: {
        corridaId: orderId,
        status: "ENTREGUE"
      }
    });

    await creditRider(order.motoboyId, companyId, riderShare, { orderId }, tx);

    logger.info({ orderId, riderShare }, "Pedido finalizado com sucesso e repasse efetuado.");

    return updatedOrder;
  });
}
