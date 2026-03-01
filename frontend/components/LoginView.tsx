
import React, { useState } from 'react';
import { Bike, Lock, User, ShieldAlert, Loader2, ServerOff } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { api } from '../api';

interface Props {
  onLogin?: (role: 'ADMIN' | 'COMPANY', token: string) => void;
}

const LoginView: React.FC<Props> = ({ onLogin }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [serverOffline, setServerOffline] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setServerOffline(false);
    
    try {
      const data = await api.post('/auth/login', { email, password });
      
      if (data && data.success) {
        login(data.user, data.token);
        if (onLogin) onLogin(data.user.role, data.token);
      } else if (data) {
        setError(data.message || 'Credenciais inválidas');
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      // Detecção de erro de rede (Servidor Down)
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('network error')) {
        setError('Falha na conexão: O servidor de API não responde.');
        setServerOffline(true);
      } else {
        setError(err.message || 'Erro interno ao processar login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl shadow-slate-200 p-12 border border-slate-100">
        <div className="flex flex-col items-center mb-10">
          <div className="bg-orange-500 p-4 rounded-2xl mb-5 shadow-xl shadow-orange-500/20">
            <Bike size={32} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Moto Gestor</h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">Acesso Restrito ao Operador</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className={`p-4 rounded-2xl text-xs font-bold border flex gap-3 animate-in fade-in zoom-in duration-300 ${
              serverOffline ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-red-50 border-red-200 text-red-600'
            }`}>
              {serverOffline ? <ServerOff size={18} className="shrink-0" /> : <ShieldAlert size={18} className="shrink-0" />}
              <div>
                <p className="uppercase tracking-wider mb-1">{serverOffline ? 'Servidor Offline' : 'Erro de Acesso'}</p>
                <p className="font-medium normal-case opacity-90">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-[0.15em]">Login de Acesso</label>
            <div className="relative group">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-orange-500 focus:bg-white transition-all font-medium text-slate-700 placeholder:text-slate-300"
                placeholder="ex: contato@suaempresa.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-[0.15em]">Senha de Segurança</label>
            <div className="relative group">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-orange-500 focus:bg-white transition-all font-medium text-slate-700 placeholder:text-slate-300"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-900 text-white rounded-2xl py-5 font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Autenticar no Sistema'}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-slate-50 flex items-center justify-center gap-4">
           <div className="flex flex-col items-center">
             <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Powered By</span>
             <span className="text-xs text-slate-400 font-black tracking-tighter">MOTO GESTOR SAAS v1.0</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
