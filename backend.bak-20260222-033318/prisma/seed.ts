import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import process from 'process';
import { logger } from '../src/config/logger';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

async function main() {
  logger.info('--- MOTO GESTOR SEED START ---');
  
  // Limpeza
  await prisma.regraPreco.deleteMany();
  await prisma.historicoStatusCorrida.deleteMany();
  await prisma.corrida.deleteMany();
  await prisma.motoboy.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.user.deleteMany();
  await prisma.empresa.deleteMany();

  // 1. Empresa Master
  const empresa = await prisma.empresa.create({
    data: {
      name: 'Moto Gestor Matriz',
      plan: 'PREMIUM',
      status: 'ATIVA'
    }
  });

  // 2. Super Admin
  const adminHash = await bcrypt.hash('admin999', SALT_ROUNDS);
  await prisma.user.create({
    data: {
      email: 'admin@motogestor.com.br',
      name: 'SaaS Admin',
      passwordHash: adminHash,
      role: 'ADMIN',
      empresaId: empresa.id
    }
  });

  // 3. Operador de Empresa Exemplo
  const opHash = await bcrypt.hash('flash123', SALT_ROUNDS);
  await prisma.user.create({
    data: {
      email: 'contato@motoflash.com.br',
      name: 'Gerente MotoFlash',
      passwordHash: opHash,
      role: 'COMPANY',
      empresaId: empresa.id
    }
  });

  // 4. Regras de Preço para a Empresa Exemplo
  await prisma.regraPreco.createMany({
    data: [
      { 
        empresaId: empresa.id, 
        type: "bairro", 
        key: "Centro", 
        basePrice: 8.00, 
        minPrice: 8.00 
      },
      { 
        empresaId: empresa.id, 
        type: "bairro", 
        key: "Jardins", 
        basePrice: 15.00, 
        minPrice: 15.00 
      },
      { 
        empresaId: empresa.id, 
        type: "km", 
        basePrice: 5.00, 
        perKm: 1.50, 
        minPrice: 7.00 
      }
    ]
  });

  logger.info('✅ Banco populado com regras de preço e usuários de teste.');
}

main()
  .catch((e) => {
    logger.error(e, 'Erro ao executar seed');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
