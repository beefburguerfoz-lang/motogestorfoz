
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { getUsers, getProfile, softDeleteUser } from '../controllers/usersController';

const router = Router();

// Apenas ADMIN ou COMPANY podem listar usuários
router.get('/', requireAuth, requireRole(['ADMIN', 'COMPANY']), getUsers);

// Qualquer usuário autenticado vê seu perfil
router.get('/profile', requireAuth, getProfile);

// Apenas ADMIN pode deletar (soft delete) usuários
router.delete('/:id', requireAuth, requireRole(['ADMIN']), softDeleteUser);

export default router;
