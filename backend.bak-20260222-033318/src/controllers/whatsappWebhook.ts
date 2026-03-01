import { Request, Response } from "express";
import { getOrCreateSession, updateSession, resetSession } from "../services/conversationService";
import { sendText, sendButtons } from "../services/whatsappService";
import { validateAddress, distanceKm } from "../services/geoService";
import { calculatePrice } from "../services/pricingService";
import { createOrderFromSession } from "./orderFlowController";
import { logger } from "../config/logger";
import { prisma } from "../services/prismaClient";
import { eventService, EVENTS } from "../services/eventService";

export default async function whatsappWebhook(req: Request, res: Response) {
  try {
    const { empresaId, from, text, buttonId } = parsePayload(req.body);
    if (!empresaId || !from) return res.sendStatus(400);

    const session = await getOrCreateSession(empresaId, from);
    const sessionData = (session.data as any) || {};

    if (buttonId?.startsWith("ACCEPT_") || buttonId?.startsWith("REFUSE_")) {
       const parts = buttonId.split("_");
       const action = parts[0]; 
       const orderId = parts[1];
       const riderId = parts[2];

       if (action === "ACCEPT") {
         const result = await prisma.corrida.updateMany({
           where: { 
             id: orderId, 
             status: "PENDENTE" 
           },
           data: { 
             status: "ACEITA", 
             motoboyId: riderId 
           }
         });

         if (result.count > 0) {
           eventService.emit(EVENTS.RIDER_RESPONSE, { orderId, riderId, status: "accepted" });
           await sendText(empresaId, from, "✅ Corrida aceita com sucesso! Inicie o deslocamento para a retirada.");
         } else {
           await sendText(empresaId, from, "Corrida já aceita");
         }
       } else if (action === "REFUSE") {
         eventService.emit(EVENTS.RIDER_RESPONSE, { orderId, riderId, status: "refused" });
         await sendText(empresaId, from, "Entendido. Buscaremos outro profissional.");
       }
       return res.sendStatus(200); 
    }

    if (buttonId === "CONFIRM_ORDER") {
      await createOrderFromSession(session, empresaId, from);
      await sendText(empresaId, from, "🚀 *Pedido Confirmado!* Buscando motoboy...");
      await resetSession(session.id);
      return res.sendStatus(200);
    }

    if (buttonId === "CANCEL_ORDER") {
      await sendText(empresaId, from, "❌ Pedido cancelado.");
      await resetSession(session.id);
      return res.sendStatus(200);
    }

    switch (session.state) {
      case "IDLE":
        await sendText(empresaId, from, "Olá! Qual o endereço de *RETIRADA*?");
        await updateSession(session.id, { state: "AWAITING_PICKUP" });
        break;

      case "AWAITING_PICKUP":
        try {
          const geoPickup = await validateAddress(text);
          await updateSession(session.id, { 
            state: "AWAITING_DROPOFF",
            pickup: geoPickup.formattedAddress,
            data: { ...sessionData, pickup: geoPickup }
          });
          await sendText(empresaId, from, `📍 *Retirada:* ${geoPickup.formattedAddress}\n\nQual o endereço de *ENTREGA*?`);
        } catch (e) {
          await sendText(empresaId, from, "⚠️ Endereço não encontrado.");
        }
        break;

      case "AWAITING_DROPOFF":
        try {
          const geoDropoff = await validateAddress(text);
          const dist = distanceKm(sessionData.pickup, geoDropoff);
          const price = await calculatePrice({ 
            empresaId, 
            originBairro: sessionData.pickup.bairro, 
            distanceKm: dist 
          });

          await updateSession(session.id, { 
            state: "AWAITING_CONFIRMATION",
            dropoff: geoDropoff.formattedAddress,
            data: { ...sessionData, destination: geoDropoff, distance: dist, price }
          });

          const summary = `📋 *Pedido*\n🚩 De: ${sessionData.pickup.formattedAddress}\n🏁 Para: ${geoDropoff.formattedAddress}\n💰 R$ ${price.toFixed(2)}\n\nConfirmar?`;

          await sendButtons(empresaId, from, summary, [
            { id: "CONFIRM_ORDER", label: "Confirmar" },
            { id: "CANCEL_ORDER", label: "Cancelar" }
          ]);
        } catch (e) {
          await sendText(empresaId, from, "⚠️ Destino não encontrado.");
        }
        break;

      default:
        await resetSession(session.id);
    }

    return res.sendStatus(200);
  } catch (error) {
    logger.error(error, "Erro no Webhook");
    return res.sendStatus(500);
  }
}

function parsePayload(body: any) {
  return {
    empresaId: body.empresaId || "clm1234567890",
    from: body.from || body.phone || body.message?.from || "",
    text: body.text || body.message?.body || body.message?.text || "",
    buttonId: body.buttonId || body.message?.buttonId || null
  };
}
