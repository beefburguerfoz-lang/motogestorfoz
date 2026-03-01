import { prisma } from "./prismaClient";

type PriceOpts = {
  empresaId?: string | number;
  companyId?: string | number;
  distanciaKm?: number;
  distanceKm?: number;
  originBairro?: string;
  origin_bairro?: string;
};

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

  // If there is a bairro rule for the company, prefer it
  if (bairro) {
    const regraBairro = await prisma.regraPreco.findFirst({
      where: {
        empresaId,
        bairro,
        type: "bairro"
      },
      orderBy: { id: "desc" }
    });
    if (regraBairro) return regraBairro.basePrice ?? regraBairro.valor ?? 0;
  }

  // Otherwise fallback to km rule
  const regraKm = await prisma.regraPreco.findFirst({
    where: {
      empresaId,
      type: "km"
    },
    orderBy: { id: "desc" }
  });

  if (!regraKm) return 0;

  const base = regraKm.basePrice ?? regraKm.valor ?? 0;
  const perKm = regraKm.perKm ?? 0;
  const minP = regraKm.minPrice ?? 0;

  const calc = base + (perKm * distancia);
  return Math.max(calc, minP);
}
