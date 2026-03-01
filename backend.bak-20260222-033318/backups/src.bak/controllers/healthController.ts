

import { Request, Response } from 'express';
// Fix: Explicitly import process to resolve correct Node.js types for uptime and environment variables
import process from 'process';
import { prisma } from '../services/prismaClient';
import { logger } from '../config/logger';

/**
 * Retorna o status atual da API e da conexão com o banco de dados.
 */
export async function checkHealth(req: Request, res: Response) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    
    return res.json({
      status: 'UP',
      version: '1.0.0', // Versão atual do sistema
      timestamp: new Date().toISOString(),
      // Fix: Accessing the uptime method from the Node.js process object
      uptime: process.uptime(),
      services: {
        api: 'OK',
        database: 'CONNECTED'
      },
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    logger.error(error, 'Health check failed');
    return res.status(503).json({
      status: 'DOWN',
      timestamp: new Date().toISOString(),
      services: {
        api: 'OK',
        database: 'DISCONNECTED'
      },
      error: (error as Error).message
    });
  }
}
