
import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";

/**
 * Middleware para restringir acesso a rotas baseado no papel (role) do usuário.
 */
export const requireRole = (roles: string[]) => (req: any, res: Response, next: NextFunction) => {
  const user = (req as AuthRequest).user;
  
  if (!user || !roles.includes(user.role)) {
    return res.status(403).json({
      success: false,
      message: "Acesso negado: você não tem permissão para realizar esta ação."
    });
  }
  
  next();
};
