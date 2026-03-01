import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../services/prismaClient';
import { notDeleted } from '../utils/notDeleted';
import { logAudit } from '../services/auditService';

export async function listCustomers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const companyId = req.user?.companyId;
    const customers = await prisma.cliente.findMany({
      where: { 
        empresaId: companyId,
        ...notDeleted 
      },
      include: {
        _count: { 
          select: { 
            corridas: { where: { ...notDeleted } } 
          } 
        }
      },
      orderBy: { name: 'asc' }
    });
    return res.json(customers);
  } catch (error) {
    next(error);
  }
}

export async function upsertCustomer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, whatsapp } = req.body;
    const companyId = req.user?.companyId;
    const userId = req.user?.userId;

    if (!companyId) return res.status(401).json({ success: false, message: 'Não autorizado' });

    const customer = await prisma.cliente.upsert({
      where: { 
        whatsapp_empresaId: { whatsapp, empresaId: companyId } 
      },
      update: { 
        name,
        deletedAt: null 
      },
      create: { name, whatsapp, empresaId: companyId }
    });

    await logAudit({
      userId,
      action: "CUSTOMER_UPSERTED",
      entity: "CLIENTE",
      entityId: customer.id,
      metadata: { whatsapp }
    });

    return res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
}

export async function softDeleteCustomer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    const userId = req.user?.userId;

    await prisma.cliente.update({
      where: { id, empresaId: companyId },
      data: { deletedAt: new Date() }
    });

    await logAudit({
      userId,
      action: "CUSTOMER_DELETED",
      entity: "CLIENTE",
      entityId: id
    });

    return res.json({ success: true, message: 'Cliente arquivado com sucesso' });
  } catch (error) {
    next(error);
  }
}
