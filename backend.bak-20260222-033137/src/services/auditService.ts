
import { prisma } from "./prismaClient";
import { logger } from "../config/logger";

interface AuditParams {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: any;
}

/**
 * Registra uma ação no log de auditoria do banco de dados para rastreabilidade SaaS.
 */
export async function logAudit({
  userId,
  action,
  entity,
  entityId,
  metadata
}: AuditParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined
      }
    });
  } catch (error) {
    // Falha silenciosa no banco mas ruidosa no log estruturado para não travar a aplicação
    logger.error({ error, action, entity }, 'Falha ao registrar log de auditoria no banco');
  }
}
