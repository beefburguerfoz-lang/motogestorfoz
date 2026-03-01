
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { listCompanies, createCompany, updateCompanyStatus } from '../controllers/companiesController';

const router = Router();

// Apenas Super Admins podem gerenciar as empresas do SaaS
router.get('/', requireAuth, requireRole(['ADMIN']), listCompanies);
router.post('/', requireAuth, requireRole(['ADMIN']), createCompany);
router.patch('/:id/status', requireAuth, requireRole(['ADMIN']), updateCompanyStatus);

export default router;
