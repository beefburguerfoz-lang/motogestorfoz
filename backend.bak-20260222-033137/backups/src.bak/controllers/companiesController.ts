import { Request, Response, NextFunction } from 'express';
import { prisma } from '../services/prismaClient';
import { logger } from '../config/logger';

export async function listCompanies(req: Request, res: Response, next: NextFunction) {
  try {
    const companies = await prisma.empresa.findMany({
      include: {
        _count: {
          select: { users: true, corridas: true }
        }
      }
    });
    return res.json(companies);
  } catch (error) {
    next(error);
  }
}

export async function createCompany(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, cnpj, plan } = req.body;
    
    const company = await prisma.empresa.create({
      data: { name, cnpj, plan: plan || 'TESTE' }
    });

    logger.info({ companyId: company.id }, `Nova empresa criada: ${name}`);
    return res.status(201).json(company);
  } catch (error) {
    next(error);
  }
}

export async function updateCompanyStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const company = await prisma.empresa.update({
      where: { id },
      data: { status }
    });

    return res.json(company);
  } catch (error) {
    next(error);
  }
}
