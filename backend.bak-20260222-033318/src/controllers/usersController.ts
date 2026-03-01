import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../services/prismaClient';
import { notDeleted } from '../utils/notDeleted';
import { logAudit } from '../services/auditService';

export async function getUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const where = req.user?.role === 'ADMIN' 
      ? { ...notDeleted } 
      : { empresaId: req.user?.companyId, ...notDeleted };

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });
    return res.json(users);
  } catch (error) {
    next(error);
  }
}

export async function getProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Não autenticado' });

    const user = await prisma.user.findFirst({
      where: { id: req.user.userId, ...notDeleted },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        empresa: {
          select: { name: true, plan: true, status: true }
        }
      }
    });

    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    return res.json(user);
  } catch (error) {
    next(error);
  }
}

export async function softDeleteUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    const userId = req.user?.userId;

    await prisma.user.update({
      where: { id, empresaId: companyId },
      data: { deletedAt: new Date() }
    });

    await logAudit({
      userId,
      action: "USER_DELETED",
      entity: "USER",
      entityId: id
    });

    return res.json({ success: true, message: 'Usuário removido do sistema.' });
  } catch (error) {
    next(error);
  }
}
