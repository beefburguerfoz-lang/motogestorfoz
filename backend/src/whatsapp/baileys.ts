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
import { prisma } from "../services/prismaClient";

let sock: WASocket | null = null;
let connecting = false;
let desiredConnection = false;
let connected = false;
let qrDataUrl: string | null = null;
let lastError: string | null = null;
let resolvedCompanyIdCache: string | null = null;
const companyBindingFile = process.env.WA_COMPANY_BINDING_FILE
  ? path.resolve(process.env.WA_COMPANY_BINDING_FILE)
  : path.resolve(process.cwd(), ".wa-company-binding.json");

type CompanyBinding = {
  companyId: string;
  companyName?: string | null;
  connectedJid?: string | null;
  updatedAt: string;
};

type CompanyCandidate = { id: string; name?: string | null };

function getCompanyId() {
  return process.env.DEFAULT_COMPANY_ID || "";
}

function readCompanyBinding(): CompanyBinding | null {
  try {
    if (!fs.existsSync(companyBindingFile)) return null;
    const raw = fs.readFileSync(companyBindingFile, "utf8");
    const parsed = JSON.parse(raw);
    const companyId = parsed?.companyId || parsed?.empresaId;
    if (!companyId) return null;
    return {
      companyId: String(companyId),
      companyName: parsed.companyName ? String(parsed.companyName) : null,
      connectedJid: parsed.connectedJid ? String(parsed.connectedJid) : null,
      updatedAt: String(parsed.updatedAt || new Date().toISOString())
    };
  } catch (error) {
    logger.error({ error }, "Falha ao ler vínculo WhatsApp-empresa");
    return null;
  }
}

function writeCompanyBinding(binding: CompanyBinding) {
  try {
    fs.writeFileSync(companyBindingFile, JSON.stringify(binding, null, 2));
  } catch (error) {
    logger.error({ error }, "Falha ao salvar vínculo WhatsApp-empresa");
  }
}

export async function setWhatsAppCompanyBinding(companyId: string) {
  const company = await prisma.empresa.findUnique({ where: { id: companyId }, select: { id: true, name: true } });
  if (!company?.id) {
    throw new Error("company_not_found");
  }

  const binding: CompanyBinding = {
    companyId: company.id,
    companyName: company.name || null,
    connectedJid: sock?.user?.id || null,
    updatedAt: new Date().toISOString()
  };
  writeCompanyBinding(binding);
  resolvedCompanyIdCache = company.id;
  logger.warn({ companyId: company.id, companyName: company.name }, "Vínculo WhatsApp-empresa atualizado");
  return binding;
}

export function getWhatsAppCompanyBinding() {
  return readCompanyBinding();
}

export function getWhatsAppCompanyBindingFilePath() {
  return companyBindingFile;
}

export function resolveCompanyIdFromCandidates(input: {
  bindingCompanyId?: string | null;
  companies: CompanyCandidate[];
}) {
  if (input.bindingCompanyId) {
    return { companyId: input.bindingCompanyId, source: "binding" as const };
  }

  if (input.companies.length === 1 && input.companies[0]?.id) {
    return { companyId: input.companies[0].id, source: "auto_single" as const };
  }

  if (input.companies.length === 2) {
    const testCompany = input.companies.find(
      (company) => String(company.name || "").trim().toLowerCase() === "empresa cliente 01"
    );
    if (testCompany?.id) {
      return { companyId: testCompany.id, source: "auto_test_company" as const };
    }
  }

  return { companyId: null, source: "unresolved" as const };
}

async function resolveCompanyId() {
  try {
    const companyBinding = readCompanyBinding();
    if (companyBinding?.companyId) {
      resolvedCompanyIdCache = companyBinding.companyId;
      logger.info({ companyId: companyBinding.companyId, source: "binding", companyBindingFile }, "companyId resolvido");
      return companyBinding.companyId;
    }

    if (resolvedCompanyIdCache) {
      logger.info({ companyId: resolvedCompanyIdCache, source: "cache" }, "companyId resolvido");
      return resolvedCompanyIdCache;
    }

    const companies = await prisma.empresa.findMany({
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
      take: 50
    });

    const selected = resolveCompanyIdFromCandidates({
      bindingCompanyId: null,
      companies
    });

    if (selected.companyId) {
      resolvedCompanyIdCache = selected.companyId;
      logger.warn({ companyId: selected.companyId, source: selected.source }, "companyId resolvido");
      return selected.companyId;
    }

    const configuredCompanyId = getCompanyId();
    if (configuredCompanyId) {
      resolvedCompanyIdCache = configuredCompanyId;
      logger.info({ companyId: configuredCompanyId, source: "env" }, "companyId resolvido");
      return configuredCompanyId;
    }

    if (companies.length > 1) {
      logger.warn(
        { companies: companies.map((company) => ({ id: company.id, name: company.name })) },
        "Não foi possível resolver companyId automaticamente; configure vínculo em /api/whatsapp/company-binding"
      );
    }
  } catch (error) {
    logger.error({ error, companyBindingFile }, "Falha ao resolver companyId no WhatsApp");
  }

  return "";
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

        const empresaId = await resolveCompanyId();
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
        lastError = null;
      }

      if (connection === "open") {
        connected = true;
        connecting = false;
        qrDataUrl = null;
        lastError = null;
        const binding = readCompanyBinding();
        if (binding?.companyId) {
          writeCompanyBinding({
            ...binding,
            connectedJid: sock?.user?.id || binding.connectedJid || null,
            updatedAt: new Date().toISOString()
          });
        }
        logger.info({ companyBindingFile, connectedJid: sock?.user?.id || null }, "WhatsApp conectado com sucesso");
      }

      if (connection === "close") {
        connected = false;
        connecting = false;

        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut && desiredConnection;
        lastError = statusCode ? `connection_closed_${statusCode}` : "connection_closed";

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
    lastError = (error as Error)?.message || "start_socket_failed";
    logger.error({ error }, "Falha ao iniciar socket do WhatsApp");
  }
}

export async function connectWhatsApp() {
  desiredConnection = true;
  lastError = null;
  await startSocket();
}

export async function disconnectWhatsApp() {
  desiredConnection = false;
  connecting = false;
  connected = false;
  qrDataUrl = null;

  if (sock) {
    try {
      await sock.logout();
    } catch (error) {
      lastError = (error as Error)?.message || "logout_failed";
      logger.warn({ error }, "Falha no logout do WhatsApp; continuando com encerramento local da sessão");
    } finally {
      try {
        sock.end(new Error("manual_disconnect"));
      } catch (endError) {
        logger.warn({ endError }, "Falha ao encerrar socket localmente");
      }
      sock = null;
    }
  }
}

export function getWhatsAppStatus() {
  return {
    connected,
    connecting,
    desired: desiredConnection,
    hasQr: !!qrDataUrl,
    lastError
  };
}

export function getWhatsAppQrPngDataUrl() {
  return qrDataUrl;
}

export async function resetWhatsAppSession() {
  try {
    await disconnectWhatsApp();
  } catch (disconnectError) {
    lastError = (disconnectError as Error)?.message || "disconnect_failed_on_reset";
    logger.warn({ disconnectError }, "Falha durante disconnect no reset; tentando limpar sessão mesmo assim");
  }

  const sessionDir = path.resolve(process.cwd(), ".wa-session");
  try {
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true });
      logger.warn({ sessionDir }, "Sessão WhatsApp removida para forçar novo QR");
    }
  } catch (error) {
    lastError = (error as Error)?.message || "session_cleanup_failed";
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

export async function sendBaileysList(
  to: string,
  text: string,
  options: { id: string; label: string }[]
) {
  if (!sock || !connected) {
    throw new Error("whatsapp_not_connected");
  }

  const rows = options.slice(0, 10).map((option) => ({
    title: option.label,
    rowId: option.id,
    description: ""
  }));

  return sock.sendMessage(to, {
    text,
    footer: "Selecione uma opção",
    buttonText: "Ver opções",
    sections: [
      {
        title: "Opções disponíveis",
        rows
      }
    ]
  } as any);
}
