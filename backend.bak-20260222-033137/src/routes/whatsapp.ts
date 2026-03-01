
import { Router } from 'express';
import whatsappWebhook from '../controllers/whatsappWebhook';

const router = Router();

// Rota pública para receber eventos do provedor de WhatsApp
router.post('/webhook', whatsappWebhook);

export default router;
