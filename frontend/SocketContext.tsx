import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";

type SocketCtx = {
  socket: Socket | null;
  connected: boolean;
};

const SocketContext = createContext<SocketCtx>({ socket: null, connected: false });

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("mg_token") || localStorage.getItem("token");
    const socketUrl = import.meta.env.VITE_SOCKET_URL ?? window.location.origin;

    const s = io(socketUrl, {
      path: "/api/socket.io",
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 800,
      reconnectionDelayMax: 5000,
    });

    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));
    setSocket(s);

    return () => {
      try { s.disconnect(); } catch {}
      setSocket(null);
      setConnected(false);
    };
  }, []);

  const value = useMemo(() => ({ socket, connected }), [socket, connected]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
