import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { prisma } from '../services/prismaClient';
import { logger } from '../config/logger';
import { logAudit } from '../services/auditService';

export async function login(req: Request, res: Response, next: NextFunction){
  const { email, password } = req.body;
  
  try {
    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { empresa: true }
    });

    if(!user || user.deletedAt) {
      logger.warn({ email }, `Tentativa de login falha: Usuário inexistente ou deletado`);
      
      await logAudit({
        action: "LOGIN_FAILED",
        entity: "USER",
        metadata: { email, reason: "Inexistente ou Deletado" }
      });

      return res.status(401).json({ success: false, message: 'Email ou senha incorretos' });
    }

    if(user.empresa.status === 'BLOQUEADA') {
      logger.warn({ companyName: user.empresa.name, email }, `Tentativa de login bloqueada: Empresa inativa`);
      
      await logAudit({
        userId: user.id,
        action: "LOGIN_BLOCKED",
        entity: "USER",
        entityId: user.id,
        metadata: { reason: "Empresa Bloqueada" }
      });

      return res.status(403).json({ success: false, message: 'Acesso bloqueado. Entre em contato com o suporte.' });
    }
    
    const ok = await bcrypt.compare(password, user.passwordHash);
    
    if(!ok) {
      logger.warn({ email }, `Tentativa de login falha: Senha incorreta`);
      
      await logAudit({
        userId: user.id,
        action: "LOGIN_FAILED",
        entity: "USER",
        entityId: user.id,
        metadata: { email, reason: "Senha incorreta" }
      });

      return res.status(401).json({ success: false, message: 'Email ou senha incorretos' });
    }
    
    const token = jwt.sign(
      { 
        userId: user.id, 
        role: user.role, 
        empresaId: user.empresaId 
      }, 
      process.env.JWT_SECRET as string, 
      { expiresIn: '12h' }
    );

    logger.info({ email, role: user.role }, `Login realizado com sucesso`);

    await logAudit({
      userId: user.id,
      action: "LOGIN_SUCCESS",
      entity: "USER",
      entityId: user.id
    });

    return res.json({ 
      success: true,
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        companyId: user.empresaId 
      }
    });
  } catch (error) {
    next(error);
  }
}
