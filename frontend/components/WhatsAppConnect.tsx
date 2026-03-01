import React, { useEffect, useState } from "react";
import { api } from "../api";

export const WhatsAppConnect: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const s = await api.get("/whatsapp/status");
      if (!s) return;
      setStatus(s);

      // só busca QR se estiver conectando ou se já tiver QR disponível
      if (s.hasQr || s.connecting) {
        const q = await api.get("/whatsapp/qr");
        setQr(q?.dataUrl || null);
      } else {
        setQr(null);
      }
    } catch (e) {
      console.error("Erro WhatsApp", e);
    }
  };

  const connect = async () => {
    setBusy(true);
    try {
      await api.post("/whatsapp/connect", {});
      await load();
    } finally {
      setBusy(false);
    }
  };

  const resetSession = async () => {
    setBusy(true);
    try {
      await api.post("/whatsapp/reset-session", {});
      await load();
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    try {
      await api.post("/whatsapp/disconnect", {});
      await load();
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 2500);
    return () => clearInterval(t);
  }, []);

  const connected = !!status?.connected;
  const connecting = !!status?.connecting;

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Conexão WhatsApp</h2>

      <div style={{ marginBottom: 16, opacity: 0.9 }}>
        {connected ? "✅ Conectado" : connecting ? "⏳ Conectando (aguardando QR)..." : "⚠️ Desconectado (clique Conectar)"}
        {status?.lastError ? <div style={{ color: "#ff6b6b", marginTop: 6 }}>Erro: {String(status.lastError)}</div> : null}
        {!connected && !connecting && status?.desired && !status?.hasQr ? (
          <div style={{ color: "#f5c542", marginTop: 6 }}>Sem QR disponível. Clique em "Resetar sessão e gerar novo QR".</div>
        ) : null}
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        {!connected && (
          <>
            <button onClick={connect} disabled={busy} style={{ padding: "10px 14px", borderRadius: 12 }}>
              {busy ? "Conectando..." : "Conectar"}
            </button>
            <button onClick={resetSession} disabled={busy} style={{ padding: "10px 14px", borderRadius: 12 }}>
              {busy ? "Resetando..." : "Resetar sessão e gerar novo QR"}
            </button>
          </>
        )}
        {connected && (
          <button onClick={disconnect} disabled={busy} style={{ padding: "10px 14px", borderRadius: 12 }}>
            {busy ? "Desconectando..." : "Desconectar"}
          </button>
        )}
      </div>

      {qr ? <img src={qr} alt="QR Code WhatsApp" style={{ width: 320, borderRadius: 12 }} /> : null}
    </div>
  );
};
