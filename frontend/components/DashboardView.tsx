
import React from 'react';
import { 
  Package, 
  Bike, 
  DollarSign, 
  TrendingUp,
  MessageSquare,
  Clock,
  CheckCircle2,
  Plus,
  ArrowRight,
  Zap
} from 'lucide-react';
import { Order, Rider } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  stats: {
    activeOrders: number;
    totalRiders: number;
    availableRiders: number;
    todayRevenue: number;
  };
  orders: Order[];
  riders: Rider[];
}

const chartData = [
  { name: 'Seg', entregas: 45 },
  { name: 'Ter', entregas: 52 },
  { name: 'Qua', entregas: 48 },
  { name: 'Qui', entregas: 61 },
  { name: 'Sex', entregas: 85 },
  { name: 'Sáb', entregas: 92 },
  { name: 'Dom', entregas: 38 },
];

const DashboardView: React.FC<Props> = ({ stats, orders, riders }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bom dia, Operador! 👋</h1>
          <p className="text-slate-500 mt-1">Sua empresa está com 98% de eficiência nas rotas.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-2xl text-xs font-bold border border-emerald-100 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            Bot WhatsApp Ativo
          </div>
          <button className="bg-slate-900 text-white px-5 py-3 rounded-2xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-200">
            <Plus size={18} />
            Lançar Corrida
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Em Andamento" 
          value={stats.activeOrders.toString()} 
          icon={<Zap size={24} className="text-blue-600" />} 
          trend="+5 nas últimas 1h"
          color="bg-blue-50"
        />
        <StatCard 
          label="Frota Disponível" 
          value={`${stats.availableRiders}/${stats.totalRiders}`} 
          icon={<Bike size={24} className="text-orange-600" />} 
          trend="Equipe completa"
          color="bg-orange-50"
        />
        <StatCard 
          label="Receita Bruta" 
          value={`R$ ${((stats.todayRevenue ?? 0).toFixed(2))}`} 
          icon={<DollarSign size={24} className="text-emerald-600" />} 
          trend="82% da meta diária"
          color="bg-emerald-50"
        />
        <StatCard 
          label="Tempo de Coleta" 
          value="12 min" 
          icon={<Clock size={24} className="text-purple-600" />} 
          trend="-2 min vs ontem"
          color="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Recent Orders Table */}
        <div className="lg:col-span-3 space-y-8">
          <div className="bg-white rounded-[32px] border p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-bold text-lg text-slate-800">Monitor de Pedidos</h2>
              <button className="text-orange-500 text-sm font-bold hover:underline flex items-center gap-1">
                Ver todos <ArrowRight size={14} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                    <th className="pb-4">Cliente</th>
                    <th className="pb-4">Destino Principal</th>
                    <th className="pb-4">Status Atual</th>
                    <th className="pb-4 text-right">Faturamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {orders.map((order) => (
                    <tr key={order.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="py-5">
                        <div className="font-bold text-sm text-slate-800">{order.customerName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ID-{order.id.padStart(4, '0')}</div>
                      </td>
                      <td className="py-5 text-xs text-slate-600 max-w-[200px] truncate">{order.destination}</td>
                      <td className="py-5">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="py-5 font-bold text-sm text-right text-slate-900">R$ {((order.price ?? 0).toFixed(2))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-[32px] border p-8 shadow-sm">
            <h2 className="font-bold text-lg text-slate-800 mb-8">Fluxo Semanal</h2>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#94a3b8' }} 
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="entregas" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 5 ? '#f97316' : '#cbd5e1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Sidebar Activity Feed */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-[32px] p-6 shadow-xl shadow-slate-200">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <Activity size={18} className="text-orange-400" /> Atividade Bot
            </h3>
            <div className="space-y-6">
              <ActivityItem 
                time="Agora" 
                user="Farmácia Central" 
                action="solicitou nova corrida via WhatsApp" 
                status="new"
              />
              <ActivityItem 
                time="2m atrás" 
                user="Rider João Silva" 
                action="marcou pedido #0012 como entregue" 
                status="success"
              />
              <ActivityItem 
                time="10m atrás" 
                user="Bot Moto Gestor" 
                action="calculou R$ 18,50 para cliente" 
                status="info"
              />
            </div>
            <button className="w-full mt-8 py-3 bg-white/10 hover:bg-white/20 transition-all rounded-2xl text-xs font-bold">
              Ver Logs Completos
            </button>
          </div>

          <div className="bg-orange-50 border border-orange-100 rounded-[32px] p-6">
            <h4 className="font-bold text-orange-900 text-sm flex items-center gap-2">
              <TrendingUp size={16} /> Dica do Gestor
            </h4>
            <p className="text-xs text-orange-800 mt-2 leading-relaxed">
              Sua equipe está subutilizada no turno da manhã. Considere oferecer uma tarifa reduzida (R$ 1.80/km) para farmácias nesse horário.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ActivityItem: React.FC<{ time: string, user: string, action: string, status: 'new' | 'success' | 'info' }> = ({ time, user, action, status }) => (
  <div className="flex gap-3">
    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${status === 'new' ? 'bg-orange-500' : status === 'success' ? 'bg-emerald-400' : 'bg-blue-400'}`}></div>
    <div className="space-y-1">
      <p className="text-[10px] text-slate-400 font-medium">{time}</p>
      <p className="text-xs">
        <span className="font-bold">{user}</span> {action}
      </p>
    </div>
  </div>
);

const StatCard: React.FC<{ label: string, value: string, icon: React.ReactNode, trend: string, color: string }> = ({ label, value, icon, trend, color }) => (
  <div className="bg-white p-6 rounded-3xl border shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-2xl ${color}`}>
        {icon}
      </div>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tempo Real</span>
    </div>
    <div className="space-y-1">
      <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">{label}</h3>
      <div className="text-3xl font-bold text-slate-900">{value}</div>
    </div>
    <div className="mt-4 text-[10px] font-bold text-slate-400 flex items-center gap-1">
      {trend}
    </div>
  </div>
);

export const StatusBadge: React.FC<{ status: Order['status'] }> = ({ status }) => {
  const config = {
    PENDENTE: { label: 'Aguardando', class: 'bg-orange-100 text-orange-700' },
    EM_ANDAMENTO: { label: 'Em curso', class: 'bg-blue-100 text-blue-700' },
    ENTREGUE: { label: 'Concluído', class: 'bg-emerald-100 text-emerald-700' },
    CANCELADO: { label: 'Cancelado', class: 'bg-slate-100 text-slate-500' },
  };

  const item = config[status];
  return (
    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${item.class}`}>
      {item.label}
    </span>
  );
};

const Activity: React.FC = () => null; // Dummy for type safety in imports if needed

export default DashboardView;
