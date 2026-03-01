
import React, { useState, useEffect } from 'react';
import { Company, ServerMetrics } from '../types';
import { 
  ShieldCheck, 
  Plus, 
  Search, 
  Ban, 
  CheckCircle, 
  Clock, 
  Cpu, 
  Activity,
  HardDrive,
  Building2,
  X,
  Loader2,
  Beaker,
  Play,
  Terminal,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { api } from '../api';
import { useNotify } from './Notification';
import { useSocket } from '../SocketContext';

const AdminView: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: '', cnpj: '', plan: 'TESTE' });
  const { notify } = useNotify();
  const { socket } = useSocket();
  const [activeSubTab, setActiveSubTab] = useState<'instances' | 'tests'>('instances');
  const [testLogs, setTestLogs] = useState<{message: string, type: string}[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  const [metrics, setMetrics] = useState<ServerMetrics>({
    cpu: 18, ram: 42, disk: 15, uptime: '12d 4h 22m'
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('TEST_LOG', (log: any) => {
      setTestLogs(prev => [...prev, log]);
      if (log.type === 'done') setIsSimulating(false);
    });
    return () => { socket.off('TEST_LOG'); };
  }, [socket]);

  const fetchCompanies = async () => {
    setIsLoading(true);
    try {
      const data = await api.get('/companies');
      if (data) setCompanies(data);
    } catch (err) {
      notify('error', 'Falha ao carregar empresas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setTestLogs([]);
    try {
      await api.post('/admin-tools/simulate-wa', {});
      notify('info', 'Simulação de fluxo iniciada no laboratório');
    } catch (err) {
      notify('error', 'Falha ao disparar simulação');
      setIsSimulating(false);
    }
  };

  const renderTests = () => (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[32px] border shadow-sm">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl">
                   <Beaker size={24} />
                </div>
                <h3 className="font-bold text-lg">Suíte de Saúde</h3>
             </div>
             
             <div className="space-y-4">
                <TestStatusItem label="Pricing Engine" status="PASS" />
                <TestStatusItem label="Geolocation API" status="PASS" />
                <TestStatusItem label="WhatsApp Webhook" status="PASS" />
                <TestStatusItem label="Socket Server" status="PASS" />
                <TestStatusItem label="Financial Ledger" status="PASS" />
             </div>

             <button className="w-full mt-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
                <Zap size={18} /> Re-validar Sistema
             </button>
          </div>

          <div className="bg-orange-50 p-8 rounded-[32px] border border-orange-100">
             <h4 className="font-bold text-orange-900 mb-2">Simulação E2E</h4>
               <p className="text-sm text-orange-800 opacity-80 mb-6">Executa um fluxo completo de pedido (WA → Painel → Despacho) para validar integridade.</p>
             <button 
                onClick={handleRunSimulation}
                disabled={isSimulating}
                className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 disabled:opacity-50"
             >
                {isSimulating ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
                Simular Pedido WA
             </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-slate-900 rounded-[32px] p-8 shadow-2xl h-[600px] flex flex-col">
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3 text-white">
                   <Terminal size={20} className="text-orange-400" />
                   <span className="font-mono text-xs font-bold uppercase tracking-widest">Test Lab Console</span>
                </div>
                <div className="flex gap-1.5">
                   <div className="w-2 h-2 rounded-full bg-red-500"></div>
                   <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                   <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                </div>
             </div>
             
             <div className="flex-1 overflow-y-auto font-mono text-xs space-y-2 custom-scrollbar pr-4">
                {testLogs.length === 0 && (
                   <p className="text-slate-500 italic">Aguardando execução de testes...</p>
                )}
                {testLogs.map((log, i) => (
                   <div key={i} className={`flex gap-3 ${
                      log.type === 'error' ? 'text-red-400' : 
                      log.type === 'success' ? 'text-emerald-400' :
                      log.type === 'done' ? 'text-orange-400 font-bold' : 'text-slate-300'
                   }`}>
                      <span className="opacity-30">[{new Date().toLocaleTimeString()}]</span>
                      <span>{log.message}</span>
                   </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Infraestrutura SaaS</h1>
          <p className="text-slate-500 mt-1">Gerenciamento global e garantia de qualidade técnica.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveSubTab('instances')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeSubTab === 'instances' ? 'bg-slate-900 text-white' : 'bg-white border text-slate-500 hover:bg-slate-50'}`}
          >
            Instâncias
          </button>
          <button 
            onClick={() => setActiveSubTab('tests')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeSubTab === 'tests' ? 'bg-slate-900 text-white' : 'bg-white border text-slate-500 hover:bg-slate-50'}`}
          >
            Test Lab
          </button>
        </div>
      </div>

      {activeSubTab === 'tests' ? renderTests() : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard label="CPU Usage" value={`${metrics.cpu}%`} icon={<Cpu size={20} />} color="text-blue-500" />
            <MetricCard label="RAM Usage" value={`${metrics.ram}%`} icon={<Activity size={20} />} color="text-purple-500" />
            <MetricCard label="Disk Space" value={`${metrics.disk}%`} icon={<HardDrive size={20} />} color="text-emerald-500" />
            <MetricCard label="VPS Uptime" value={metrics.uptime} icon={<Clock size={20} />} color="text-orange-500" />
          </div>

          <div className="bg-white rounded-[32px] border overflow-hidden shadow-sm">
            <div className="p-6 border-b flex items-center justify-between bg-slate-50/50">
               <div className="bg-white border px-4 py-2.5 rounded-xl flex items-center gap-3 w-96">
                  <Search size={18} className="text-slate-400" />
                  <input type="text" placeholder="Buscar empresa..." className="bg-transparent outline-none w-full text-sm" />
               </div>
               <button 
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 bg-orange-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-orange-600 transition-all shadow-md shadow-orange-100"
                >
                  <Plus size={18} /> Nova Empresa
                </button>
            </div>

            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-orange-500" size={40} /></div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50">
                    <tr className="text-[10px] font-bold uppercase text-slate-400 tracking-widest border-b">
                      <th className="px-6 py-4">Empresa</th>
                      <th className="px-6 py-4">Plano</th>
                      <th className="px-6 py-4">WhatsApp</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {companies.map((company) => (
                      <tr key={company.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-5 font-bold text-slate-800">{company.name}</td>
                        <td className="px-6 py-5"><span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">{company.plan}</span></td>
                        <td className="px-6 py-5">
                          <div className={`w-2 h-2 rounded-full ${company.whatsAppInstanceStatus === 'ONLINE' ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`}></div>
                        </td>
                        <td className="px-6 py-5"><StatusBadge status={company.status} /></td>
                        <td className="px-6 py-5 text-right">
                          <button className="p-2 text-slate-400 hover:text-slate-600"><Ban size={18} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const TestStatusItem: React.FC<{ label: string, status: 'PASS' | 'FAIL' }> = ({ label, status }) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
    <span className="text-sm font-medium text-slate-600">{label}</span>
    <div className={`flex items-center gap-1.5 font-black text-[10px] ${status === 'PASS' ? 'text-emerald-500' : 'text-red-500'}`}>
       {status === 'PASS' ? <CheckCircle2 size={14} /> : <X size={14} />}
       {status}
    </div>
  </div>
);

const MetricCard: React.FC<{ label: string, value: string, icon: React.ReactNode, color: string }> = ({ label, value, icon, color }) => (
  <div className="bg-white p-4 rounded-2xl border shadow-sm flex items-center gap-4">
    <div className={`p-2.5 rounded-xl bg-slate-50 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold text-slate-900">{value}</p>
    </div>
  </div>
);

const StatusBadge: React.FC<{ status: Company['status'] }> = ({ status }) => {
  const styles = {
    ATIVA: 'bg-emerald-100 text-emerald-700',
    BLOQUEADA: 'bg-red-100 text-red-700',
    TESTE: 'bg-blue-100 text-blue-700',
  };
  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${styles[status as keyof typeof styles]}`}>
      {status}
    </span>
  );
};

export default AdminView;
