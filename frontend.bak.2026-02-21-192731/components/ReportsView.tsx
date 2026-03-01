
import React from 'react';
import { Order, Rider } from '../types';
import { DollarSign, PackageCheck, Users, Calendar } from 'lucide-react';

interface Props {
  orders: Order[];
  riders: Rider[];
}

const ReportsView: React.FC<Props> = ({ orders, riders }) => {
  const totalRaces = orders.filter(o => o.status === 'ENTREGUE').length;
  const totalRevenue = orders.filter(o => o.status === 'ENTREGUE').reduce((acc, o) => acc + o.price, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ReportCard title="Total Faturado" value={`R$ ${totalRevenue.toFixed(2)}`} icon={<DollarSign className="text-green-500" />} />
        <ReportCard title="Corridas Concluídas" value={totalRaces.toString()} icon={<PackageCheck className="text-blue-500" />} />
        <ReportCard title="Motoboys Ativos" value={riders.length.toString()} icon={<Users className="text-orange-500" />} />
        <ReportCard title="Média por Corrida" value={`R$ ${(totalRevenue / (totalRaces || 1)).toFixed(2)}`} icon={<Calendar className="text-purple-500" />} />
      </div>

      <div className="bg-white rounded-[32px] border overflow-hidden">
        <div className="p-6 border-b bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">Ganhos por Motoboy</h3>
          <button className="text-orange-500 text-sm font-bold hover:underline">Exportar PDF</button>
        </div>
        <table className="w-full text-left">
          <thead className="bg-white border-b">
            <tr className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">
              <th className="px-6 py-4">Motoboy</th>
              <th className="px-6 py-4">Corridas</th>
              <th className="px-6 py-4">Repasse (80%)</th>
              <th className="px-6 py-4 text-right">Total Acumulado</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {riders.map(rider => (
              <tr key={rider.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold">{rider.name[0]}</div>
                    <span className="font-bold text-slate-700 text-sm">{rider.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">12</td>
                <td className="px-6 py-4 text-sm text-slate-600">R$ {(rider.totalEarnings * 0.8).toFixed(2)}</td>
                <td className="px-6 py-4 text-right font-bold text-slate-900">R$ {rider.totalEarnings.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ReportCard: React.FC<{ title: string, value: string, icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="bg-white p-6 rounded-2xl border flex flex-col items-center text-center shadow-sm">
    <div className="p-3 bg-slate-50 rounded-2xl mb-4">{icon}</div>
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
    <p className="text-2xl font-bold text-slate-900">{value}</p>
  </div>
);

export default ReportsView;
