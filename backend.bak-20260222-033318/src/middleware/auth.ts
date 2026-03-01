import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export type AuthRequest = Request & {
  user?: { userId: string; role: string; companyId: string }
}

export function requireAuth(req: Request, res: Response, next: NextFunction){
  const auth = req.get('authorization');
  if(!auth) return res.status(401).json({ success: false, message: 'Token não fornecido' });
  
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    (req as AuthRequest).user = { 
      userId: payload.userId, 
      role: payload.role,
      companyId: payload.empresaId // Mapeia empresaId do token para companyId do request
    };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token inválido ou expirado' });
  }
}
