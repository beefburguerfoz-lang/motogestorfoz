import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../services/prismaClient';
import { orderSchema, orderStatusSchema } from '../validators/schemas';
import { logAudit } from '../services/auditService';
import { finalizeOrder } from '../services/financeService';
import { logger } from '../config/logger';

export async function listOrders(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const companyId = req.user?.companyId;
    const orders = await prisma.corrida.findMany({
      where: { 
        empresaId: companyId, 
        deletedAt: null 
      },
      include: {
        cliente: { select: { name: true, whatsapp: true } },
        motoboy: { select: { name: true, telefone: true } },
        historico: { orderBy: { createdAt: 'desc' }, take: 10 }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(orders);
  } catch (error) {
    next(error);
  }
}

export async function createOrder(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const companyId = req.user?.companyId;
    const userId = req.user?.userId;
    if (!companyId) return res.status(401).json({ success: false, message: 'Não autorizado' });

    const data = orderSchema.parse(req.body);

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.corrida.create({
        data: {
          empresaId: companyId,
          clienteNome: data.customerName,
          clienteTelefone: data.customerPhone,
          valor: data.amount,
          enderecoRetirada: data.origin,
          enderecoEntrega: data.destination,
          status: 'PENDENTE',
        }
      });

      await tx.historicoStatusCorrida.create({
        data: {
          corridaId: newOrder.id,
          status: 'PENDENTE'
        }
      });

      return newOrder;
    });

    await logAudit({
      userId,
      action: "ORDER_CREATED",
      entity: "CORRIDA",
      entityId: order.id,
      metadata: { amount: data.amount }
    });
    
    return res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
}

export async function updateOrderStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status, riderId } = orderStatusSchema.parse(req.body);
    const companyId = req.user?.companyId || '';
    const userId = req.user?.userId;

    if (status === 'ENTREGUE') {
      const order = await finalizeOrder(id, companyId);
      
      await logAudit({
        userId,
        action: "ORDER_FINALIZED",
        entity: "CORRIDA",
        entityId: id,
        metadata: { status: "ENTREGUE" }
      });

      return res.json({ success: true, data: order });
    }

    const order = await prisma.$transaction(async (tx) => {
      const updated = await tx.corrida.update({
        where: { id, empresaId: companyId },
        data: { 
          status, 
          motoboyId: riderId || undefined,
          updatedAt: new Date()
        }
      });

      await tx.historicoStatusCorrida.create({
        data: { corridaId: id, status }
      });

      if (status === 'CANCELADO' && updated.motoboyId) {
        await tx.motoboy.update({
          where: { id: updated.motoboyId },
          data: { status: 'DISPONIVEL' }
        });
      }

      return updated;
    });

    await logAudit({
      userId,
      action: "ORDER_STATUS_UPDATED",
      entity: "CORRIDA",
      entityId: id,
      metadata: { newStatus: status, riderId }
    });

    return res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
}

export async function softDeleteOrder(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    const userId = req.user?.userId;

    await prisma.corrida.update({
      where: { id, empresaId: companyId },
      data: { deletedAt: new Date() }
    });

    await logAudit({
      userId,
      action: "ORDER_ARCHIVED",
      entity: "CORRIDA",
      entityId: id
    });

    return res.json({ success: true, message: 'Pedido arquivado com sucesso.' });
  } catch (error) {
    next(error);
  }
}

export async function getOrderById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;

    const order = await prisma.corrida.findFirst({
      where: { id, empresaId: companyId, deletedAt: null },
      include: {
        cliente: true,
        motoboy: true,
        historico: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!order) return res.status(404).json({ success: false, message: 'Pedido não encontrado.' });
    return res.json(order);
  } catch (error) {
    next(error);
  }
}
