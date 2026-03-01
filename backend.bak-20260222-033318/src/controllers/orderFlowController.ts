import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../services/prismaClient';
import { logAudit } from '../services/auditService';

/**
 * Handler HTTP para criação de pedido (compatível)
 */
export async function createOrder(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ success: false, message: 'Não autorizado' });

    const { clienteId, enderecoRetirada, enderecoEntrega, valor, clienteNome, clienteTelefone } = req.body;

    const order = await prisma.corrida.create({
      data: {
        empresaId: companyId,
        clienteId: clienteId || null,
        clienteNome: clienteNome || null,
        clienteTelefone: clienteTelefone || null,
        enderecoRetirada: enderecoRetirada || null,
        enderecoEntrega: enderecoEntrega || null,
        valor: valor || 0,
        status: 'PENDENTE'
      }
    });

    await prisma.historicoStatusCorrida.create({
      data: { corridaId: order.id, status: 'PENDENTE' }
    });

    await logAudit({ userId: req.user?.userId, action: "ORDER_CREATED", entity: "CORRIDA", entityId: order.id });
    return res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
}

/**
 * createOrderFromSession - compatível com duas assinaturas:
 * 1) createOrderFromSession(companyId: string, sessionData: any)
 * 2) createOrderFromSession(session: any, companyId: string, from?: string)
 *
 * Detecta automaticamente os argumentos e cria o pedido.
 */
export async function createOrderFromSession(arg1: any, arg2?: any, arg3?: any) {
  let sessionData: any;
  let companyId: string | undefined;
  let from: string | undefined;

  // caso 1: (companyId: string, sessionData: any)
  if (typeof arg1 === 'string') {
    companyId = arg1;
    sessionData = arg2 || {};
    from = arg3;
  } else {
    // caso 2: (session: any, companyId: string, from?: string)
    sessionData = arg1 || {};
    companyId = arg2;
    from = arg3;
  }

  if (!companyId) throw new Error('companyId_required');

  // normaliza campos que podem vir em formatos diferentes
  const clienteNome = sessionData.customerName || sessionData.name || sessionData.customer_nome || null;
  const clienteTelefone = sessionData.customerPhone || sessionData.phone || sessionData.customer_telefone || null;
  const enderecoRetirada = (sessionData.pickup && (sessionData.pickup.address || sessionData.pickup)) || sessionData.enderecoRetirada || null;
  const enderecoEntrega = (sessionData.dropoff && (sessionData.dropoff.address || sessionData.dropoff)) || sessionData.enderecoEntrega || null;
  const valor = sessionData.amount || sessionData.valor || 0;

  const order = await prisma.corrida.create({
    data: {
      empresaId: companyId,
      clienteNome,
      clienteTelefone,
      enderecoRetirada,
      enderecoEntrega,
      valor,
      status: 'PENDENTE'
    }
  });

  await prisma.historicoStatusCorrida.create({
    data: { corridaId: order.id, status: 'PENDENTE' }
  });

  // registra auditoria se possível
  try {
    await logAudit({ userId: undefined, action: "ORDER_CREATED_FROM_SESSION", entity: "CORRIDA", entityId: order.id, metadata: JSON.stringify({ from }) });
  } catch (e) {
    // não falha o fluxo por conta da auditoria
    console.warn('logAudit falhou:', e);
  }

  return order;
}
