
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useNotify } from './components/Notification';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user, isAuthenticated } = useAuth();
  const { notify } = useNotify();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isAuthenticated && token && user) {
      // Em produção, a URL deve vir de uma variável de ambiente
      const socketInstance = io('http://localhost:4000', {
        auth: { token },
        transports: ['websocket']
      });

      socketInstance.on('connect', () => {
        setIsConnected(true);
        console.log('Real-time feed connected');
        // Se junta à sala da empresa
        socketInstance.emit('join_company', user.companyId);
      });

      socketInstance.on('disconnect', () => {
        setIsConnected(false);
      });

      socketInstance.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
      };
    } else {
      setIsConnected(false);
      setSocket(null);
    }
  }, [isAuthenticated, token, user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
