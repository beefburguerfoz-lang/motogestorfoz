
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { listOrders, createOrder, getOrderById, updateOrderStatus } from '../controllers/ordersController';
import { validate } from '../middleware/validate';
import { orderSchema } from '../validators/schemas';

const router = Router();

router.get('/', requireAuth, listOrders);
router.get('/:id', requireAuth, getOrderById);
router.post('/', requireAuth, validate(orderSchema), createOrder);
router.patch('/:id/status', requireAuth, updateOrderStatus);

export default router;
