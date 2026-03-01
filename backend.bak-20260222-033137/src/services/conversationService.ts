import { prisma } from "./prismaClient";
import { EstadoConversa } from "@prisma/client";

export async function getOrCreateSession(companyId: string, phone: string) {
  let session = await prisma.conversationSession.findUnique({
    where: { companyId_phone: { companyId, phone } }
  });

  if (!session) {
    session = await prisma.conversationSession.create({
      data: { 
        companyId, 
        phone, 
        state: "IDLE",
        data: {} 
      }
    });
  }

  return session;
}

export async function updateSession(id: string, updateData: { state?: EstadoConversa, pickup?: string, dropoff?: string, data?: any }) {
  return prisma.conversationSession.update({
    where: { id },
    data: {
      ...updateData,
      data: updateData.data ? updateData.data : undefined
    }
  });
}

export async function resetSession(id: string) {
  return prisma.conversationSession.update({
    where: { id },
    data: {
      state: "IDLE",
      pickup: null,
      dropoff: null,
      data: {}
    }
  });
}
