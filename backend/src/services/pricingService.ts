import { prisma } from "./prismaClient";
import { logger } from "../config/logger";

type PriceOpts = {
  empresaId?: string | number;
  companyId?: string | number;
  distanciaKm?: number;
  distanceKm?: number;
  originBairro?: string;
  origin_bairro?: string;
};

function normalizeMode(raw: string | null | undefined) {
  return String(raw || "KM").toUpperCase() === "BAIRRO" ? "BAIRRO" : "KM";
}

async function getPricingMode(empresaId: string) {
  const cfg = await prisma.regraPreco.findFirst({
    where: { empresaId, type: "config", key: "pricing_mode" },
    orderBy: { createdAt: "desc" }
  });
  return normalizeMode(cfg?.bairro);
}

/**
 * calculatePrice accepts an object for compatibility with multiple callers.
 * Returns a number (price in BRL).
 */
export async function calculatePrice(opts: PriceOpts) {
  const empresaIdRaw = opts.empresaId ?? opts.companyId;
  if (!empresaIdRaw) return 0;
  const empresaId = String(empresaIdRaw);

  const distancia = opts.distanciaKm ?? opts.distanceKm ?? 0;
  const bairro = opts.originBairro ?? opts.origin_bairro ?? undefined;

  const mode = await getPricingMode(empresaId);

  if (mode === "BAIRRO") {
    if (bairro) {
      const regraBairro = await prisma.regraPreco.findFirst({
        where: {
          empresaId,
          bairro,
          type: "bairro"
        },
        orderBy: { createdAt: "desc" }
      });
      if (regraBairro) return regraBairro.basePrice ?? regraBairro.valor ?? 0;
    }

    logger.warn({ empresaId, bairro }, "Bairro não encontrado na tabela de preços; aplicando fallback KM");
  }

  const regraKm = await prisma.regraPreco.findFirst({
    where: {
      empresaId,
      type: "km"
    },
    orderBy: { createdAt: "desc" }
  });

  if (!regraKm) return 0;

  const base = regraKm.basePrice ?? 0;
  const perKm = regraKm.perKm ?? regraKm.valor ?? 0;
  const minP = regraKm.minPrice ?? 0;

  const calc = base + perKm * distancia;
  return Math.max(calc, minP);
}
