import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../services/prismaClient';
import { logger } from '../config/logger';
import { notDeleted } from '../utils/notDeleted';
import { logAudit } from '../services/auditService';

export async function listRiders(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const companyId = req.user?.companyId;
    const riders = await prisma.motoboy.findMany({
      where: { 
        empresaId: companyId,
        ...notDeleted
      },
      orderBy: { name: 'asc' }
    });
    return res.json(riders);
  } catch (error) {
    next(error);
  }
}

export async function createRider(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, phone, packageType, packageSize } = req.body;
    const companyId = req.user?.companyId;
    const userId = req.user?.userId;

    if (!companyId) return res.status(401).json({ success: false, message: 'Não autorizado' });

    const rider = await prisma.motoboy.create({
      data: {
        name,
        telefone: phone,
        tipoBag: packageType,
        tamanhoBag: packageSize,
        empresaId: companyId,
        status: 'DISPONIVEL'
      }
    });

    await logAudit({
      userId,
      action: "RIDER_CREATED",
      entity: "MOTOBOY",
      entityId: rider.id
    });

    logger.info({ riderId: rider.id, companyId }, `Motoboy criado: ${name}`);
    return res.status(201).json({ success: true, data: rider });
  } catch (error) {
    next(error);
  }
}

export async function softDeleteRider(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    const userId = req.user?.userId;

    await prisma.motoboy.update({
      where: { id, empresaId: companyId },
      data: { 
        deletedAt: new Date(),
        status: 'OFFLINE'
      }
    });

    await logAudit({
      userId,
      action: "RIDER_DELETED",
      entity: "MOTOBOY",
      entityId: id
    });

    logger.info({ riderId: id, companyId }, `Motoboy removido do sistema (soft delete)`);
    return res.json({ success: true, message: 'Motoboy removido do sistema' });
  } catch (error) {
    next(error);
  }
}

export async function updateRiderStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const companyId = req.user?.companyId;

    const rider = await prisma.motoboy.update({
      where: { id, empresaId: companyId, ...notDeleted },
      data: { status }
    });

    logger.info({ riderId: id, status }, `Status do motoboy atualizado`);
    return res.json({ success: true, data: rider });
  } catch (error) {
    next(error);
  }
}
