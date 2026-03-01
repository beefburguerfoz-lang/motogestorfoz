async function resolveCompanyId() {
  const configuredCompanyId = getCompanyId();
  if (configuredCompanyId) {
    resolvedCompanyIdCache = configuredCompanyId;
    return configuredCompanyId;
  }

  if (resolvedCompanyIdCache) {
    return resolvedCompanyIdCache;
  }

  const companies = await prisma.empresa.findMany({
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
    take: 50
  });

  if (companies.length === 1 && companies[0]?.id) {
    resolvedCompanyIdCache = companies[0].id;
    logger.warn(
      { empresaId: companies[0].id },
      "DEFAULT_COMPANY_ID ausente; usando automaticamente a única empresa encontrada"
    );
    return companies[0].id;
  }

  const preferredCompanyName = (process.env.DEFAULT_COMPANY_NAME || "Empresa Cliente 01").trim().toLowerCase();
  const preferredCompany = companies.find(
    (company) => company.id && String(company.name || "").trim().toLowerCase() === preferredCompanyName
  );

  if (preferredCompany?.id) {
    resolvedCompanyIdCache = preferredCompany.id;
    logger.warn(
      { empresaId: preferredCompany.id, companyName: preferredCompany.name },
      "DEFAULT_COMPANY_ID ausente; usando empresa padrão por nome"
    );
    return preferredCompany.id;
  }

  if (companies.length > 1) {
    logger.warn(
      { companies: companies.map((company) => ({ id: company.id, name: company.name })) },
      "DEFAULT_COMPANY_ID ausente e múltiplas empresas encontradas; configure DEFAULT_COMPANY_ID ou DEFAULT_COMPANY_NAME"
    );
  }

  return "";
}