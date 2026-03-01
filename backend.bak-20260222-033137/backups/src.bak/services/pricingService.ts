import { prisma } from "./prismaClient";

export async function calculatePrice(
  arg: string | number | { empresaId: string | number; distanciaKm?: number },
  distanciaKm?: number
): Promise<number> {
  let empresaIdRaw: string | number;
  let km: number | undefined;

  if (typeof arg === "object") {
    empresaIdRaw = arg.empresaId;
    km = arg.distanciaKm;
  } else {
    empresaIdRaw = arg;
    km = distanciaKm;
  }

  const empresaId = String(empresaIdRaw);

  const regra = await prisma.regraPreco.findFirst({
    where: { empresaId },
    orderBy: { id: "desc" },
  });

  if (!regra) return 0;

  if (km !== undefined && regra.perKm != null) {
    const base = regra.basePrice ?? regra.valor ?? 0;
    const perKm = regra.perKm ?? 0;
    return Number(base + km * perKm);
  }

  return Number(regra.valor ?? regra.basePrice ?? 0);
}
