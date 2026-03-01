
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { listCustomers, upsertCustomer, softDeleteCustomer } from '../controllers/customersController';
import { validate } from '../middleware/validate';
import { customerSchema } from '../validators/schemas';

const router = Router();

router.get('/', requireAuth, listCustomers);
router.post('/', requireAuth, validate(customerSchema), upsertCustomer);
router.delete('/:id', requireAuth, softDeleteCustomer);

export default router;
