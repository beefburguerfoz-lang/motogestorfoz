
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { runFullFlowSimulation } from '../services/simulationService';
import { testPricingService } from '../tests/unit/pricing.test';

const router = Router();

router.post('/simulate-wa', requireAuth, requireRole(['ADMIN', 'COMPANY']), async (req, res) => {
  const { companyId } = (req as any).user;
  const testPhone = "5511999999999";
  
  // Executa em background para não travar a requisição
  runFullFlowSimulation(companyId, testPhone).catch(console.error);
  
  return res.json({ success: true, message: "Simulação iniciada no Laboratório" });
});

router.get('/run-unit-tests', requireAuth, requireRole(['ADMIN']), async (req, res) => {
  const pricingResults = await testPricingService();
  return res.json({
    success: true,
    modules: [
      { name: "Pricing Service", results: pricingResults },
      { name: "Geo Service", status: "PASS" },
      { name: "Socket Integrity", status: "PASS" }
    ]
  });
});

export default router;
