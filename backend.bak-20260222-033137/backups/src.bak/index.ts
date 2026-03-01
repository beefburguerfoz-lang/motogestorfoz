
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './config/logger';
import { httpLogger } from "./middleware/loggerMiddleware";
import { initSocket } from './services/socketService';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Inicializa WebSockets
initSocket(httpServer);

// Segurança de Headers
app.use(helmet());

// CORS Configurado
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json());

// Logger de requisições estruturado
app.use(httpLogger);

// Rate Limit Global
const globalLimiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, 
  max: 1000,
  message: { success: false, message: 'Limite de requisições excedido. Tente novamente mais tarde.' }
});
app.use(globalLimiter);

// Rotas da API
app.use('/api', routes);

// Middleware de Erro Global
app.use(errorHandler);

const port = process.env.PORT || 4000;
httpServer.listen(port, () => {
  logger.info(`🚀 Moto Gestor API Blindada + Realtime iniciada na porta ${port}`);
});
