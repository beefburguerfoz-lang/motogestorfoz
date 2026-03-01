
import { logger } from "../config/logger";
import { emitToCompany } from "./socketService";
import whatsappWebhook from "../controllers/whatsappWebhook";

interface SimulationStep {
  name: string;
  payload: any;
  expectedState?: string;
}

/**
 * Motor de simulação para testes de integração visual e funcional.
 */
export async function runFullFlowSimulation(companyId: string, phone: string) {
  const steps: SimulationStep[] = [
    { 
      name: "Início da Conversa", 
      payload: { companyId, from: phone, text: "Oi" } 
    },
    { 
      name: "Informando Retirada", 
      payload: { companyId, from: phone, text: "Rua Direita, 100, Centro" } 
    },
    { 
      name: "Informando Destino", 
      payload: { companyId, from: phone, text: "Av. Paulista, 1000" } 
    },
    { 
      name: "Confirmando Pedido", 
      payload: { companyId, from: phone, buttonId: "CONFIRM_ORDER" } 
    }
  ];

  logger.info({ companyId, phone }, "Iniciando Simulação de Fluxo WA");
  emitToCompany(companyId, "TEST_LOG", { message: "🚀 Iniciando simulação de fluxo completo...", type: "info" });

  for (const step of steps) {
    try {
      emitToCompany(companyId, "TEST_LOG", { message: `Simulando etapa: ${step.name}`, type: "step" });
      
      // Criamos um objeto de resposta mockado
      const mockRes = { 
        sendStatus: (status: number) => {
          logger.debug(`Simulação status: ${status}`);
          return mockRes;
        } 
      } as any;

      await whatsappWebhook({ body: step.payload } as any, mockRes);
      
      // Delay artificial para visualização no dashboard
      await new Promise(r => setTimeout(r, 1500));
      
      emitToCompany(companyId, "TEST_LOG", { message: `Etapa ${step.name} concluída com sucesso.`, type: "success" });
    } catch (error: any) {
      emitToCompany(companyId, "TEST_LOG", { message: `Falha na etapa ${step.name}: ${error.message}`, type: "error" });
      throw error;
    }
  }

  emitToCompany(companyId, "TEST_LOG", { message: "✅ Simulação finalizada. Pedido criado e despacho iniciado!", type: "done" });
}
