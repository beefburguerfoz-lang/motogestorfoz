import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  getPricingConfig,
  savePricingConfig,
  listNeighborhoodPrices,
  createNeighborhoodPrice,
  updateNeighborhoodPrice,
  deleteNeighborhoodPrice
} from "../controllers/pricingController";

const router = Router();

router.get('/config', requireAuth, getPricingConfig);
router.put('/config', requireAuth, savePricingConfig);
router.post('/config', requireAuth, savePricingConfig);

router.get('/neighborhoods', requireAuth, listNeighborhoodPrices);
router.post('/neighborhoods', requireAuth, createNeighborhoodPrice);
router.patch('/neighborhoods/:id', requireAuth, updateNeighborhoodPrice);
router.delete('/neighborhoods/:id', requireAuth, deleteNeighborhoodPrice);

export default router;
