
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { listRiders, createRider, updateRiderStatus, softDeleteRider } from '../controllers/ridersController';
import { validate } from '../middleware/validate';
import { riderSchema } from '../validators/schemas';

const router = Router();

router.get('/', requireAuth, listRiders);
router.post('/', requireAuth, validate(riderSchema), createRider);
router.patch('/:id/status', requireAuth, updateRiderStatus);
router.delete('/:id', requireAuth, softDeleteRider);

export default router;
