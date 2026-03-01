
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'COMPANY';
  companyId: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('mg_token');
    const savedUser = localStorage.getItem('mg_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (userData: User, newToken: string) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('mg_token', newToken);
    localStorage.setItem('mg_user', JSON.stringify(userData));
    localStorage.setItem('mg_role', userData.role);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('mg_token');
    localStorage.removeItem('mg_user');
    localStorage.removeItem('mg_role');
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      logout, 
      isAuthenticated: !!token 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return context;
};
