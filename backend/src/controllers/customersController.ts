import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../services/prismaClient';
import { logAudit } from '../services/auditService';

/**
 * Lista clientes da empresa do usuário
 */
export async function listCustomers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const companyId = req.user?.companyId;
    const customers = await prisma.cliente.findMany({
      where: { empresaId: companyId },
      orderBy: { name: 'asc' }
    });
    return res.json(customers);
  } catch (error) {
    next(error);
  }
}

/**
 * Cria ou atualiza cliente (upsert por id ou whatsapp)
 */
export async function upsertCustomer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const companyId = req.user?.companyId;
    const { id, name, whatsapp } = req.body;
    if (!companyId) return res.status(401).json({ success: false, message: 'Não autorizado' });

    if (id) {
      const updated = await prisma.cliente.update({
        where: { id },
        data: { name, whatsapp }
      });
      await logAudit({ userId: req.user?.userId, action: "CUSTOMER_UPDATED", entity: "CLIENTE", entityId: id });
      return res.json({ success: true, data: updated });
    }

    // tenta localizar por whatsapp + empresa
    const existing = await prisma.cliente.findFirst({
      where: { whatsapp, empresaId: companyId }
    });

    if (existing) {
      const updated = await prisma.cliente.update({
        where: { id: existing.id },
        data: { name }
      });
      await logAudit({ userId: req.user?.userId, action: "CUSTOMER_UPDATED", entity: "CLIENTE", entityId: existing.id });
      return res.json({ success: true, data: updated });
    }

    const created = await prisma.cliente.create({
      data: { name: name || "Cliente", whatsapp, empresaId: companyId }
    });
    await logAudit({ userId: req.user?.userId, action: "CUSTOMER_CREATED", entity: "CLIENTE", entityId: created.id });
    return res.status(201).json({ success: true, data: created });

  } catch (error) {
    next(error);
  }
}

/**
 * Remove cliente (hard delete, porque schema não tem deletedAt)
 */
export async function softDeleteCustomer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const companyId = req.user?.companyId;
    const { id } = req.params;
    if (!companyId) return res.status(401).json({ success: false, message: 'Não autorizado' });

    const customer = await prisma.cliente.findUnique({ where: { id } });
    if (!customer) return res.status(404).json({ success: false, message: 'Cliente não encontrado' });
    if (customer.empresaId !== companyId) return res.status(403).json({ success: false, message: 'Acesso negado' });

    await prisma.cliente.delete({ where: { id } });
    await logAudit({ userId: req.user?.userId, action: "CUSTOMER_DELETED", entity: "CLIENTE", entityId: id });

    return res.json({ success: true, message: 'Cliente removido' });
  } catch (error) {
    next(error);
  }
}

/**
 * Compatibilidade: findOrCreateCustomer usada por integrações (mantemos)
 */
export async function findOrCreateCustomer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, whatsapp } = req.body;
    const companyId = req.user?.companyId;
    if (!companyId || !whatsapp) {
      return res.status(400).json({ error: "empresaId e whatsapp obrigatórios" });
    }

    let customer = await prisma.cliente.findFirst({
      where: { whatsapp, empresaId: companyId }
    });

    if (!customer) {
      customer = await prisma.cliente.create({
        data: { name: name || "Cliente", whatsapp, empresaId: companyId }
      });
    }

    return res.json(customer);
  } catch (error) {
    next(error);
  }
}
