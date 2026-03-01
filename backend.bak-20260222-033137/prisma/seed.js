"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const process_1 = __importDefault(require("process"));
const logger_1 = require("../src/config/logger");
const prisma = new client_1.PrismaClient();
const SALT_ROUNDS = 12;
async function main() {
    logger_1.logger.info('--- MOTO GESTOR SEED START ---');
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
    const adminHash = await bcrypt_1.default.hash('admin999', SALT_ROUNDS);
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
    const opHash = await bcrypt_1.default.hash('flash123', SALT_ROUNDS);
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
    logger_1.logger.info('✅ Banco populado com regras de preço e usuários de teste.');
}
main()
    .catch((e) => {
    logger_1.logger.error(e, 'Erro ao executar seed');
    process_1.default.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
