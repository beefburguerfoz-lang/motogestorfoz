import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import { prisma } from "../services/prismaClient";
import { logger } from "../config/logger";

const CONFIG_KEY = "pricing_mode";

function normalizeMode(mode: any) {
  return String(mode || "KM").toUpperCase() === "BAIRRO" ? "BAIRRO" : "KM";
}

export async function getPricingConfig(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ success: false, message: "Não autorizado" });

    const [modeCfg, kmRule] = await Promise.all([
      prisma.regraPreco.findFirst({ where: { empresaId: companyId, type: "config", key: CONFIG_KEY }, orderBy: { createdAt: "desc" } }),
      prisma.regraPreco.findFirst({ where: { empresaId: companyId, type: "km" }, orderBy: { createdAt: "desc" } })
    ]);

    const pricingMode = normalizeMode(modeCfg?.bairro || "KM");
    const valuePerKm = kmRule?.perKm ?? kmRule?.valor ?? 0;

    return res.json({ success: true, data: { pricingMode, valuePerKm } });
  } catch (error) {
    next(error);
  }
}

export async function savePricingConfig(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ success: false, message: "Não autorizado" });

    const pricingMode = normalizeMode(req.body?.pricingMode);
    const valuePerKm = Number(req.body?.valuePerKm || 0);

    await prisma.regraPreco.create({
      data: {
        empresaId: companyId,
        type: "config",
        key: CONFIG_KEY,
        bairro: pricingMode,
        valor: 0
      }
    });

    if (valuePerKm > 0) {
      const kmRule = await prisma.regraPreco.findFirst({ where: { empresaId: companyId, type: "km" }, orderBy: { createdAt: "desc" } });
      if (kmRule) {
        await prisma.regraPreco.update({ where: { id: kmRule.id }, data: { perKm: valuePerKm, valor: valuePerKm } });
      } else {
        await prisma.regraPreco.create({
          data: {
            empresaId: companyId,
            type: "km",
            key: "km_default",
            perKm: valuePerKm,
            valor: valuePerKm,
            basePrice: 0,
            minPrice: 0
          }
        });
      }
    }

    return res.json({ success: true, message: "Configuração de cobrança salva." });
  } catch (error) {
    next(error);
  }
}

export async function listNeighborhoodPrices(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ success: false, message: "Não autorizado" });

    const q = String(req.query.q || "").trim();
    const data = await prisma.regraPreco.findMany({
      where: {
        empresaId: companyId,
        type: "bairro",
        ...(q ? { bairro: { contains: q, mode: "insensitive" } } : {})
      },
      orderBy: { bairro: "asc" }
    });

    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function createNeighborhoodPrice(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ success: false, message: "Não autorizado" });

    const bairro = String(req.body?.bairro || "").trim();
    const valor = Number(req.body?.valor || 0);
    if (!bairro || valor <= 0) return res.status(400).json({ success: false, message: "bairro e valor obrigatórios" });

    const row = await prisma.regraPreco.create({
      data: { empresaId: companyId, type: "bairro", bairro, valor, basePrice: valor, key: `bairro_${bairro.toLowerCase()}` }
    });

    return res.status(201).json({ success: true, data: row });
  } catch (error) {
    next(error);
  }
}

export async function updateNeighborhoodPrice(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ success: false, message: "Não autorizado" });

    const { id } = req.params;
    const bairro = req.body?.bairro != null ? String(req.body.bairro).trim() : undefined;
    const valor = req.body?.valor != null ? Number(req.body.valor) : undefined;

    const current = await prisma.regraPreco.findUnique({ where: { id } });
    if (!current || current.empresaId !== companyId || current.type !== "bairro") {
      logger.warn({ id, companyId }, "Tentativa de editar regra de outra empresa");
      return res.status(404).json({ success: false, message: "Regra não encontrada" });
    }

    const updated = await prisma.regraPreco.update({
      where: { id },
      data: {
        ...(bairro ? { bairro } : {}),
        ...(valor != null ? { valor, basePrice: valor } : {})
      }
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

export async function deleteNeighborhoodPrice(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ success: false, message: "Não autorizado" });

    const { id } = req.params;
    const current = await prisma.regraPreco.findUnique({ where: { id } });
    if (!current || current.empresaId !== companyId || current.type !== "bairro") {
      return res.status(404).json({ success: false, message: "Regra não encontrada" });
    }

    await prisma.regraPreco.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error) {
    next(error);
  }
}
