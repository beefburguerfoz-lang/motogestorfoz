import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { createServer } from "http";
import routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./config/logger";
import { httpLogger } from "./middleware/loggerMiddleware";
import { initSocket } from "./services/socketService";
import whatsappRoutes from "./whatsapp/routes";

dotenv.config();

const app = express();
app.set("trust proxy", 1);
const httpServer = createServer(app);

// Inicializa WebSockets
initSocket(httpServer);

// Endpoint simples de liveness
app.get("/", (_req, res) => {
  res.send("MotoGestor API OK");
});

// Segurança de headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    optionsSuccessStatus: 200,
  })
);

app.use(express.json());
app.use(httpLogger);

// Rate limit global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    message: "Limite de requisições excedido. Tente novamente mais tarde.",
  },
  keyGenerator: (req) => {
    const xf = req.headers["x-forwarded-for"];
    const xff = Array.isArray(xf) ? xf[0] : xf ? String(xf).split(",")[0].trim() : "";
    return String(req.ip || xff || req.socket?.remoteAddress || "unknown");
  },
});
app.use(globalLimiter);

// Rotas
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api", routes);

// Erros
app.use(errorHandler);

const port = process.env.PORT || 4000;
httpServer.listen(port, () => {
  logger.info(`🚀 Moto Gestor API Blindada + Realtime iniciada na porta ${port}`);
});
