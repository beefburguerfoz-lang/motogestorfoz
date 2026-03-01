
import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export interface AppError extends Error {
  status?: number;
  code?: string;
}

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Tratamento de erro padrão
  const status = err.status || 500;
  const message = (status === 500 && isProduction) 
    ? 'Ocorreu um erro interno. Nossa equipe técnica foi notificada.' 
    : err.message;

  // Log estruturado do erro
  logger.error({
    method: req.method,
    url: req.url,
    error: err.message,
    stack: err.stack,
    body: req.body,
    userId: (req as any).user?.userId
  }, `Error handling request ${req.method} ${req.url}`);

  return res.status(status).json({
    success: false,
    message,
    code: err.code || 'INTERNAL_SERVER_ERROR',
    // Em dev, enviamos o erro completo
    ...( !isProduction && { stack: err.stack, details: err.errors })
  });
};
