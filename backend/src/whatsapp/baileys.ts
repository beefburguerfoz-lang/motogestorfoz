import makeWASocket, {
  Browsers,
  ConnectionState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  WASocket,
  proto
} from "@whiskeysockets/baileys";
import qrcode from "qrcode";
import fs from "fs";
import path from "path";
import { logger } from "../config/logger";
import { processIncomingBotMessage } from "../services/botPipelineService";

let sock: WASocket | null = null;
let connecting = false;
let desiredConnection = false;
let connected = false;
let qrDataUrl: string | null = null;

function getCompanyId() {
  return process.env.DEFAULT_COMPANY_ID || "";
}

function unwrapMessageContent(message: proto.IMessage | null | undefined): proto.IMessage | null | undefined {
  if (!message) return message;
  return (
    message.ephemeralMessage?.message ||
    message.viewOnceMessage?.message ||
    message.viewOnceMessageV2?.message ||
    message.viewOnceMessageV2Extension?.message ||
    message
  );
}

export function extractIncomingText(message: proto.IMessage | null | undefined) {
  const content = unwrapMessageContent(message);
  if (!content) return { text: "", buttonId: null as string | null };

  const interactiveParamsJson =
    content.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson || null;

  let parsedInteractiveButtonId: string | null = null;
  if (interactiveParamsJson) {
    try {
      const parsed = JSON.parse(String(interactiveParamsJson));
      parsedInteractiveButtonId =
        (parsed?.id && String(parsed.id)) ||
        (parsed?.button_id && String(parsed.button_id)) ||
        (parsed?.selectedId && String(parsed.selectedId)) ||
        null;
    } catch {
      parsedInteractiveButtonId = String(interactiveParamsJson);
    }
  }

  const listReplyId = content.listResponseMessage?.singleSelectReply?.selectedRowId || null;

  const buttonId =
    content.buttonsResponseMessage?.selectedButtonId ||
    content.templateButtonReplyMessage?.selectedId ||
    listReplyId ||
    parsedInteractiveButtonId ||
    null;

  const text =
    content.conversation ||
    content.extendedTextMessage?.text ||
    content.imageMessage?.caption ||
    content.videoMessage?.caption ||
    "";

  return { text: String(text || "").trim(), buttonId: buttonId ? String(buttonId) : null };
}

async function registerMessageHandlers(currentSock: WASocket) {
  currentSock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify" && type !== "append") return;

    for (const msg of messages) {
      try {
        if (!msg.message) continue;
        if (msg.key.fromMe) continue;

        const from = msg.key.remoteJid || "";
        if (!from || from.endsWith("@broadcast") || from === "status@broadcast") continue;

        const empresaId = getCompanyId();
        if (!empresaId) {
          logger.warn({ from }, "Mensagem recebida, mas DEFAULT_COMPANY_ID não está configurado");
          try {
            await currentSock.sendMessage(from, {
              text: "⚠️ Empresa não configurada. Fale com o administrador."
            });
          } catch (notifyError) {
            logger.error({ notifyError, from }, "Falha ao notificar ausência de DEFAULT_COMPANY_ID");
          }
          continue;
        }

        const { text, buttonId } = extractIncomingText(msg.message);
        if (!text && !buttonId) continue;

        await processIncomingBotMessage({
          empresaId,
          from,
          text,
          buttonId
        });
      } catch (error) {
        logger.error({ error }, "Erro ao processar mensagem recebida no Baileys");
      }
    }
  });
}

async function startSocket() {
  if (connecting) return;
  connecting = true;

  try {
    const { state, saveCreds } = await useMultiFileAuthState(".wa-session");
    const { version, isLatest } = await fetchLatestBaileysVersion();
    logger.info({ version, isLatest }, "Baileys version resolved");

    sock = makeWASocket({
      auth: state,
      version,
      printQRInTerminal: false,
      browser: Browsers.ubuntu("Chrome")
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update: Partial<ConnectionState>) => {
      const { connection, qr, lastDisconnect } = update;

      if (qr) {
        qrDataUrl = await qrcode.toDataURL(qr);
      }

      if (connection === "open") {
        connected = true;
        connecting = false;
        qrDataUrl = null;
        logger.info("WhatsApp conectado com sucesso");
      }

      if (connection === "close") {
        connected = false;
        connecting = false;

        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut && desiredConnection;

        logger.warn({ statusCode, shouldReconnect }, "Conexão WhatsApp encerrada");

        if (shouldReconnect) {
          await startSocket();
        }
      }
    });

    await registerMessageHandlers(sock);
  } catch (error) {
    connecting = false;
    connected = false;
    logger.error({ error }, "Falha ao iniciar socket do WhatsApp");
  }
}

export async function connectWhatsApp() {
  desiredConnection = true;
  await startSocket();
}

export async function disconnectWhatsApp() {
  desiredConnection = false;
  connecting = false;
  connected = false;
  qrDataUrl = null;

  if (sock) {
    await sock.logout();
    sock.end(new Error("manual_disconnect"));
    sock = null;
  }
}

export function getWhatsAppStatus() {
  return {
    connected,
    connecting,
    desired: desiredConnection,
    hasQr: !!qrDataUrl
  };
}

export function getWhatsAppQrPngDataUrl() {
  return qrDataUrl;
}

export async function resetWhatsAppSession() {
  await disconnectWhatsApp();

  const sessionDir = path.resolve(process.cwd(), ".wa-session");
  try {
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true });
      logger.warn({ sessionDir }, "Sessão WhatsApp removida para forçar novo QR");
    }
  } catch (error) {
    logger.error({ error, sessionDir }, "Falha ao limpar .wa-session");
  }
}

export async function sendBaileysText(to: string, text: string) {
  if (!sock || !connected) {
    throw new Error("whatsapp_not_connected");
  }
  return sock.sendMessage(to, { text });
}

export async function sendBaileysButtons(
  to: string,
  text: string,
  buttons: { id: string; label: string }[]
) {
  if (!sock || !connected) {
    throw new Error("whatsapp_not_connected");
  }

  const formattedButtons = buttons.map((button) => ({
    buttonId: button.id,
    buttonText: { displayText: button.label },
    type: 1 as const
  }));

  return sock.sendMessage(to, {
    text,
    buttons: formattedButtons,
    headerType: 1
  } as any);
}
