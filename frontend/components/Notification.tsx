
import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
}

interface NotificationContextType {
  notify: (type: NotificationType, message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = useCallback((type: NotificationType, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-md w-full">
        {notifications.map(n => (
          <div 
            key={n.id}
            className={`flex items-center gap-3 p-4 rounded-2xl shadow-2xl border animate-in slide-in-from-right-10 duration-300 ${
              n.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
              n.type === 'error' ? 'bg-red-50 border-red-100 text-red-800' :
              'bg-blue-50 border-blue-100 text-blue-800'
            }`}
          >
            {n.type === 'success' && <CheckCircle size={20} className="text-emerald-500 shrink-0" />}
            {n.type === 'error' && <AlertCircle size={20} className="text-red-500 shrink-0" />}
            {n.type === 'info' && <Info size={20} className="text-blue-500 shrink-0" />}
            <p className="text-sm font-bold flex-1">{n.message}</p>
            <button 
              onClick={() => setNotifications(prev => prev.filter(item => item.id !== n.id))}
              className="p-1 hover:bg-black/5 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotify = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotify deve ser usado dentro de um NotificationProvider');
  return context;
};
