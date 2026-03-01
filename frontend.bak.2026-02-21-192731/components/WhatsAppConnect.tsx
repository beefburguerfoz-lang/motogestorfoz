
import React from 'react';
import { QrCode, CheckCircle2, RefreshCw, MessageSquare, AlertCircle } from 'lucide-react';

interface Props {
  status: 'CONNECTED' | 'DISCONNECTED';
  onConnect: () => void;
}

const WhatsAppConnect: React.FC<Props> = ({ status, onConnect }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-[32px] border p-10 shadow-sm">
        <div className="flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1 space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-slate-900">Conexão WhatsApp</h1>
              <p className="text-slate-500">Conecte o número da sua empresa para ativar o Bot de atendimento automático.</p>
            </div>

            <div className="space-y-4">
              <Step number={1} text="Abra o WhatsApp no seu celular" />
              <Step number={2} text="Toque em Dispositivos Conectados" />
              <Step number={3} text="Aponte a câmera para o código ao lado" />
            </div>

            <div className={`p-4 rounded-2xl flex items-center gap-3 ${status === 'CONNECTED' ? 'bg-green-50 border border-green-100 text-green-700' : 'bg-orange-50 border border-orange-100 text-orange-700'}`}>
              {status === 'CONNECTED' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
              <div>
                <p className="font-bold text-sm">{status === 'CONNECTED' ? 'WhatsApp Conectado!' : 'Aguardando Conexão'}</p>
                <p className="text-xs opacity-80">{status === 'CONNECTED' ? 'Seu bot está processando pedidos em tempo real.' : 'O sistema não pode receber pedidos sem uma conexão ativa.'}</p>
              </div>
            </div>
          </div>

          <div className="w-full max-w-[300px] aspect-square bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
            {status === 'CONNECTED' ? (
              <div className="flex flex-col items-center animate-in zoom-in duration-300">
                <div className="bg-green-500 text-white p-6 rounded-full mb-4 shadow-xl shadow-green-200">
                  <CheckCircle2 size={48} />
                </div>
                <h3 className="font-bold text-slate-800">Conectado com Sucesso</h3>
                <p className="text-xs text-slate-400 mt-1">Sincronizado há 2 min</p>
                <button onClick={() => window.location.reload()} className="mt-6 text-red-500 text-xs font-bold hover:underline">Desconectar Dispositivo</button>
              </div>
            ) : (
              <>
                <div className="bg-white p-4 rounded-2xl shadow-lg mb-4">
                   <QrCode size={160} className="text-slate-800" />
                </div>
                <button 
                  onClick={onConnect}
                  className="flex items-center gap-2 text-sm font-bold text-orange-500 hover:bg-orange-50 px-4 py-2 rounded-xl transition-colors"
                >
                  <RefreshCw size={16} /> Gerar Novo QR Code
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FeatureCard icon={<MessageSquare className="text-blue-500"/>} title="Chat Automático" desc="Respostas instantâneas para novos clientes." />
        <FeatureCard icon={<QrCode className="text-purple-500"/>} title="Multi-dispositivo" desc="Mantenha o painel e o bot ativos." />
        <FeatureCard icon={<CheckCircle2 className="text-green-500"/>} title="Segurança Total" desc="Criptografia de ponta a ponta via API." />
      </div>
    </div>
  );
};

const Step: React.FC<{ number: number, text: string }> = ({ number, text }) => (
  <div className="flex items-center gap-4 group">
    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-sm group-hover:bg-orange-500 group-hover:text-white transition-colors">
      {number}
    </div>
    <span className="text-slate-600 font-medium">{text}</span>
  </div>
);

const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, desc: string }> = ({ icon, title, desc }) => (
  <div className="bg-white p-6 rounded-2xl border flex gap-4 items-start">
    <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
    <div>
      <h4 className="font-bold text-slate-900 text-sm">{title}</h4>
      <p className="text-xs text-slate-500 mt-1">{desc}</p>
    </div>
  </div>
);

export default WhatsAppConnect;
