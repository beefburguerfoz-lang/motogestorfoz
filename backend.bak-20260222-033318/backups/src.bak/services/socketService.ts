
import { Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { logger } from "../config/logger";

let io: SocketServer;

export function initSocket(server: HttpServer) {
  io = new SocketServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "*",
      methods: ["GET", "POST"]
    }
  });

  // Middleware de Autenticação
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication error: No token provided"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
      (socket as any).userId = decoded.userId;
      // Ajustado para empresaId para refletir o payload do token gerado no authController
      (socket as any).companyId = decoded.empresaId;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const companyId = (socket as any).companyId;
    logger.info({ socketId: socket.id, companyId }, "Novo cliente Socket conectado");

    socket.on("join_company", (roomCompanyId) => {
      // Segurança: Só permite entrar na sala da própria empresa
      if (roomCompanyId === companyId) {
        socket.join(`company_${companyId}`);
        logger.debug({ socketId: socket.id, companyId }, "Cliente entrou na sala da empresa");
      }
    });

    socket.on("disconnect", () => {
      logger.debug({ socketId: socket.id }, "Cliente Socket desconectado");
    });
  });

  return io;
}

/**
 * Emite um evento apenas para os clientes de uma empresa específica.
 */
export function emitToCompany(companyId: string, event: string, data: any) {
  if (!io) {
    logger.warn("Tentativa de emitir socket antes da inicialização");
    return;
  }
  io.to(`company_${companyId}`).emit(event, data);
}

export function getIO() {
  return io;
}
