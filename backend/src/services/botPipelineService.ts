import { getOrCreateSession, updateSession, resetSession } from "./conversationService";
import { sendText, sendButtons } from "./whatsappService";
import { validateAddress, distanceKm } from "./geoService";
import { calculatePrice } from "./pricingService";
import { createOrderFromSession } from "../controllers/orderFlowController";
import { prisma } from "./prismaClient";
import { eventService, EVENTS } from "./eventService";
import { dispatchOrder } from "./dispatchService";
import { verifyDispatchToken } from "./dispatchTokenService";

export type IncomingBotMessage = {
  empresaId: string;
  from: string;
  text?: string;
  buttonId?: string | null;
};

type AddressResult = {
  formattedAddress: string;
  place_id: string | null;
  lat: number | null;
  lng: number | null;
  bairro: string;
};


function normalizeSelection(buttonId?: string | null, text?: string | null): string | undefined {
  if (buttonId && buttonId.trim()) return buttonId.trim();
  if (!text) return undefined;

  const t = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

  const map: Record<string, string> = {
    "1": "REQUEST_RIDE",
    "solicitar corrida": "REQUEST_RIDE",
    "solicitar": "REQUEST_RIDE",
    "corrida": "REQUEST_RIDE",

    "2": "CANCEL_ORDER",
    "cancelar corrida": "CANCEL_ORDER",
    "cancelar": "CANCEL_ORDER",

    "3": "TALK_ATTENDANT",
    "atendimento": "TALK_ATTENDANT",
    "atendente": "TALK_ATTENDANT",

    "pequena": "CARGO_SMALL",
    "pequeno": "CARGO_SMALL",
    "media": "CARGO_MEDIUM",
    "média": "CARGO_MEDIUM",
    "grande": "CARGO_LARGE",
    "fragil": "CARGO_FRAGILE",
    "frágil": "CARGO_FRAGILE",
  };

  return map[t];
}

function toAddressFallback(text: string): AddressResult {
  return {
    formattedAddress: text,
    place_id: null,
    lat: null,
    lng: null,
    bairro: "Geral"
  };
}

async function resolveAddress(text: string): Promise<AddressResult> {
  try {
    const r = await validateAddress(text);
    return {
      formattedAddress: r.formattedAddress,
      place_id: r.place_id ?? null,
      lat: r.lat ?? null,
      lng: r.lng ?? null,
      bairro: r.bairro ?? "Geral"
    };
  } catch {
    return toAddressFallback(text);
  }
}

function readDispatchAction(buttonId: string | null | undefined) {
  if (!buttonId) return null;
  if (!buttonId.startsWith("DISPATCH_")) return null;

  const isAccept = buttonId.startsWith("DISPATCH_ACCEPT_");
  const isRefuse = buttonId.startsWith("DISPATCH_REFUSE_");
  if (!isAccept && !isRefuse) return null;

  const token = buttonId.replace(/^DISPATCH_(ACCEPT|REFUSE)_/, "");
  try {
    const payload = verifyDispatchToken(token);
    return payload;
  } catch {
    return null;
  }
}


function normalizeButtonFromText(currentButtonId: string | null, text: string) {
  if (currentButtonId) return currentButtonId;
  const t = (text || "").trim().toLowerCase();

  // menu inicial
  if (t in ["1", "corrida", "solicitar", "solicitar corrida", "pedido"]) return "REQUEST_RIDE";
  if (t in ["2", "cancelar", "cancelar corrida"]) return "CANCEL_ORDER";
  if (t in ["3", "atendimento", "atendente", "suporte"]) return "TALK_ATTENDANT";

  // fluxo de mercadoria
  if (t in ["pequena", "pequeno"]) return "CARGO_SMALL";
  if (t in ["media", "média", "medio", "médio"]) return "CARGO_MEDIUM";
  if (t in ["grande"]) return "CARGO_LARGE";
  if (t in ["fragil", "frágil"]) return "CARGO_FRAGILE";

  // confirmação
  if (t in ["confirmar", "ok", "sim", "confirmo"]) return "CONFIRM_ORDER";
  if (t in ["revisar", "editar"]) return "REVIEW_ORDER";

  // observação
  if (t in ["sem observacao", "sem observação", "pular", "nao", "não"]) return "SKIP_NOTES";

  return null;
}

export async function processIncomingBotMessage(payload: IncomingBotMessage) {

  const { empresaId, from, text = "", buttonId = null } = payload;
  const normalizedButtonId = normalizeButtonFromText(buttonId, text);
  if (!empresaId || !from) {
    throw new Error("invalid_payload");
  }

  const session = await getOrCreateSession(empresaId, from);
  const sessionData = (session.data as any) || {};

  const dispatchAction = readDispatchAction(normalizedButtonId);
  if (dispatchAction) {
    const { action, orderId, riderId } = dispatchAction;

    if (action === "ACCEPT") {
      const result = await prisma.corrida.updateMany({
        where: {
          id: orderId,
          status: "PENDENTE"
        },
        data: {
          status: "EM_ANDAMENTO",
          motoboyId: riderId
        }
      });

      if (result.count > 0) {
        await prisma.historicoStatusCorrida.create({
          data: { corridaId: orderId, status: "EM_ANDAMENTO" }
        });

        const acceptedOrder = await prisma.corrida.findUnique({ where: { id: orderId } });

        eventService.emit(EVENTS.RIDER_RESPONSE, { orderId, riderId, status: "accepted" });
        await sendText(empresaId, from, "✅ Corrida aceita com sucesso! Inicie o deslocamento para a retirada.");

        if (acceptedOrder?.clienteTelefone) {
          await sendText(
            empresaId,
            acceptedOrder.clienteTelefone,
            "🚚 Sua corrida foi aceita e está em trânsito."
          );
        }
      } else {
        await sendText(empresaId, from, "Corrida já aceita");
      }
    } else if (action === "REFUSE") {
      eventService.emit(EVENTS.RIDER_RESPONSE, { orderId, riderId, status: "refused" });
      await sendText(empresaId, from, "Entendido. Buscaremos outro profissional.");
    }
    return;
  }

  if (normalizedButtonId === "CANCEL_ORDER") {
    await sendText(empresaId, from, "❌ Solicitação cancelada.");
    await resetSession(session.id);
    return;
  }

  if (normalizedButtonId === "TALK_ATTENDANT") {
    await sendText(empresaId, from, "👩‍💼 Atendimento solicitado. Em instantes alguém retorna por aqui.");
    await resetSession(session.id);
    await sendButtons(empresaId, from, "Enquanto isso, você também pode:", [
      { id: "REQUEST_RIDE", label: "Solicitar corrida" },
      { id: "TALK_ATTENDANT", label: "Atendimento" }
    ]);
    return;
  }

  if (normalizedButtonId === "REQUEST_RIDE") {
    await updateSession(session.id, {
      state: "AWAITING_PICKUP",
      data: { ...sessionData, flowStatus: "session_started" }
    });
    await sendText(empresaId, from, "📍 Informe o endereço de *RETIRADA*.");
    return;
  }

  if (normalizedButtonId === "CONFIRM_ORDER") {
    const order = await createOrderFromSession(session, empresaId, from);
    await sendText(empresaId, from, "🚀 *Pedido Confirmado!* Buscando motoboy...");
    await dispatchOrder(order.id);
    await resetSession(session.id);
    return;
  }

  if (normalizedButtonId === "REVIEW_ORDER") {
    await updateSession(session.id, {
      state: "AWAITING_PICKUP",
      data: { ...sessionData, flowStatus: "session_started" }
    });
    await sendText(empresaId, from, "Perfeito, vamos revisar. Informe novamente o endereço de *RETIRADA*.");
    return;
  }

  switch (session.state) {
    case "IDLE":
      await sendButtons(empresaId, from, "Olá! Escolha uma opção:\n1) Solicitar corrida\n2) Cancelar corrida\n3) Atendimento", [
        { id: "REQUEST_RIDE", label: "Solicitar corrida" },
        { id: "CANCEL_ORDER", label: "Cancelar corrida" },
        { id: "TALK_ATTENDANT", label: "Atendimento" }
      ]);
      await updateSession(session.id, {
        data: { ...sessionData, flowStatus: "session_started" }
      });
      break;

    case "AWAITING_PICKUP": {
      const pickup = await resolveAddress(text);
      await updateSession(session.id, {
        state: "AWAITING_DROPOFF",
        pickup: pickup.formattedAddress,
        data: { ...sessionData, pickup }
      });
      const pickupSource = pickup.place_id ? "(validado pelo Google)" : "(fallback manual)";
      await sendText(
        empresaId,
        from,
        `✅ Retirada: ${pickup.formattedAddress} ${pickupSource}\n\nAgora informe o endereço de *ENTREGA*.`
      );
      break;
    }

    case "AWAITING_DROPOFF": {
      const dropoff = await resolveAddress(text);
      const pickup = sessionData.pickup || toAddressFallback(session.pickup || "");
      const canCalcDistance = pickup.lat != null && pickup.lng != null && dropoff.lat != null && dropoff.lng != null;
      const dist = canCalcDistance ? distanceKm(pickup as any, dropoff as any) : 0;
      const price = await calculatePrice({
        empresaId,
        originBairro: pickup.bairro,
        distanceKm: dist
      });

      await updateSession(session.id, {
        state: "AWAITING_CONFIRMATION",
        dropoff: dropoff.formattedAddress,
        data: {
          ...sessionData,
          destination: dropoff,
          distance: dist,
          price,
          step: "AWAITING_CARGO"
        }
      });

      const dropoffSource = dropoff.place_id ? "(validado pelo Google)" : "(fallback manual)";
      await sendText(empresaId, from, `✅ Entrega: ${dropoff.formattedAddress} ${dropoffSource}`);
      await sendButtons(empresaId, from, "📦 Qual o tipo de mercadoria?", [
        { id: "CARGO_SMALL", label: "Pequena" },
        { id: "CARGO_MEDIUM", label: "Média" },
        { id: "CARGO_LARGE", label: "Grande" },
        { id: "CARGO_FRAGILE", label: "Frágil" }
      ]);
      break;
    }

    case "AWAITING_CONFIRMATION": {
      const step = sessionData.step || "AWAITING_CARGO";

      if (step === "AWAITING_CARGO") {
        const cargoMap: Record<string, string> = {
          CARGO_SMALL: "Pequena",
          CARGO_MEDIUM: "Média",
          CARGO_LARGE: "Grande",
          CARGO_FRAGILE: "Frágil"
        };
        const cargoType = cargoMap[normalizedButtonId || ""];
        if (!cargoType) {
          await sendText(empresaId, from, "Selecione o tipo de mercadoria pelos botões, por favor.");
          return;
        }

        await updateSession(session.id, {
          state: "AWAITING_CONFIRMATION",
          data: {
            ...sessionData,
            cargoType,
            step: "AWAITING_NOTES"
          }
        });
        await sendButtons(empresaId, from, "📝 Deseja adicionar observação?", [
          { id: "SKIP_NOTES", label: "Sem observação" }
        ]);
        await sendText(empresaId, from, "Se quiser, envie agora a observação em texto.");
        return;
      }

      if (step === "AWAITING_NOTES") {
        const notes = normalizedButtonId === "SKIP_NOTES" ? "" : text;
        const pickup = sessionData.pickup;
        const destination = sessionData.destination;
        const price = Number(sessionData.price || 0);
        const cargoType = sessionData.cargoType || "Não informado";

        await updateSession(session.id, {
          state: "AWAITING_CONFIRMATION",
          data: {
            ...sessionData,
            notes,
            flowStatus: "data_collected",
            step: "READY_TO_CONFIRM"
          }
        });

        const summary =
          `📋 *Resumo da Corrida*\n` +
          `🚩 Retirada: ${pickup?.formattedAddress || session.pickup || "-"}\n` +
          `🏁 Entrega: ${destination?.formattedAddress || session.dropoff || "-"}\n` +
          `📦 Mercadoria: ${cargoType}\n` +
          `📝 Observação: ${notes || "Sem observação"}\n` +
          `💰 Valor: R$ ${price.toFixed(2)}`;

        await sendButtons(empresaId, from, `${summary}\n\nConfirmar pedido?`, [
          { id: "CONFIRM_ORDER", label: "Confirmar" },
          { id: "REVIEW_ORDER", label: "Revisar" },
          { id: "CANCEL_ORDER", label: "Cancelar" }
        ]);
        return;
      }

      if (step === "READY_TO_CONFIRM") {
        await sendText(empresaId, from, "Use os botões do resumo para Confirmar, Revisar ou Cancelar.");
        return;
      }

      await resetSession(session.id);
      break;
    }

    default:
      await resetSession(session.id);
  }
}
