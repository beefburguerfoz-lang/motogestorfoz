
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

/**
 * Middleware genérico para validação de esquemas Zod.
 * Garante que o corpo da requisição (body) esteja em conformidade antes de chegar ao controller.
 */
export const validate = (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Erro de validação nos dados enviados',
        errors: error.errors.map(e => ({ 
          field: e.path.join('.'), 
          message: e.message 
        }))
      });
    }
    next(error);
  }
};
