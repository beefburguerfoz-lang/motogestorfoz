
import { Router } from 'express';
import authRoutes from './auth';
import usersRoutes from './users';
import ordersRoutes from './orders';
import ridersRoutes from './riders';
import customersRoutes from './customers';
import companiesRoutes from './companies';
import healthRoutes from './health';
import whatsappRoutes from './whatsapp';
import adminRoutes from './admin';
import pricingRoutes from './pricing';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/orders', ordersRoutes);
router.use('/riders', ridersRoutes);
router.use('/customers', customersRoutes);
router.use('/companies', companiesRoutes);
router.use('/whatsapp', whatsappRoutes);
router.use('/admin-tools', adminRoutes);
router.use('/pricing', pricingRoutes);

export default router;
