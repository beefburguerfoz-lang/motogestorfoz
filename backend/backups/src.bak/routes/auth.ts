
import { Router } from 'express';
import { login } from '../controllers/authController';
import { validate } from '../middleware/validate';
import { loginSchema } from '../validators/schemas';
import rateLimit from 'express-rate-limit';

const router = Router();

// Proteção específica para login: máximo 5 tentativas a cada 15 minutos por IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Muitas tentativas de login. Por segurança, tente novamente em 15 minutos."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, validate(loginSchema), login);

export default router;
