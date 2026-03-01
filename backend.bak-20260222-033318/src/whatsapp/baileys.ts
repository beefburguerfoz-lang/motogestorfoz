import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import QRCode from "qrcode";

let sock: any = null;
let lastQrPngDataUrl: string | null = null;
let isConnected = false;
let lastError: string | null = null;

export async function initWhatsApp() {
  if (sock) return;

  const { state, saveCreds } = await useMultiFileAuthState(".wa-session");

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ["MotoGestor", "Chrome", "1.0.0"],
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update: any) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      try {
        lastQrPngDataUrl = await QRCode.toDataURL(qr, { width: 320, margin: 1 });
        isConnected = false;
      } catch (e: any) {
        lastError = String(e?.message || e);
      }
    }

    if (connection === "open") {
      isConnected = true;
      lastError = null;
    }

    if (connection === "close") {
      isConnected = false;

      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      // Se não foi logout, tenta reconectar
      if (shouldReconnect) {
        sock = null;
        setTimeout(() => initWhatsApp().catch(() => {}), 1500);
      } else {
        // logout: zera QR (precisa gerar novo)
        sock = null;
        lastQrPngDataUrl = null;
      }
    }
  });

  sock.ev.on("messages.upsert", async (m: any) => {
    // Por enquanto só loga (MVP). Depois a gente pluga seu fluxo de pedidos.
    // console.log("MSG:", JSON.stringify(m, null, 2));
  });
}

export function getWhatsAppStatus() {
  return {
    connected: isConnected,
    hasQr: !!lastQrPngDataUrl,
    lastError,
  };
}

export function getWhatsAppQrPngDataUrl() {
  return lastQrPngDataUrl;
}

export async function logoutWhatsApp() {
  try {
    if (sock) await sock.logout();
  } catch {}
  sock = null;
  isConnected = false;
  lastQrPngDataUrl = null;
}
